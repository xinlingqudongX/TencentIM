import Crypto from 'crypto';
import Axios from 'axios';
import { AxiosResponse } from 'axios';
import * as tencentCloud from 'tencentcloud-sdk-nodejs';
import Zlib from 'zlib';
import { ImMsgParams, ImResult, ImServer } from 'define_type';

export default class ImServerSDK implements ImServer {
    public config: {
        ver: string;
        domain: string;
        servicename?: string;
        command?: string;
        sdkappid: string;
        identifier: string;
        usersig?: string;
        // random?: string;
        contenttype: 'json';
        expireSeconds: number;
    } = {
        domain: 'console.tim.qq.com',
        ver: 'v4',
        sdkappid: '',
        identifier: 'administrator',
        contenttype: 'json',
        expireSeconds: 60 * 60 * 24,
    };

    public headers: {
        'X-TC-Action'?: string; //    操作的接口名称
        'X-TC-Region': 'ap-beijing' | 'ap-guangzhou'; //    区域名称，地域参数
        'X-TC-Timestamp'?: string; //    时间戳，unix时间戳
        'X-TC-Version'?: string; //    版本号
        Authorization: 'TC3-HMAC-SHA256'; //    签名，见附录
        'X-TC-Token'?: string; //    业务级别的token，见附录
        'X-TC-Language': 'zh-CN' | 'en-US'; //    语言参数，默认值为zh-cn
    } = {
        Authorization: 'TC3-HMAC-SHA256',
        'X-TC-Language': 'zh-CN',
        'X-TC-Region': 'ap-guangzhou',
    };

    public keydata: {
        SecretId: string;
        SecretKey: string;
    };

    #usersig: string;
    #userBuf: string | null;
    #userBufsig: string;
    #sigTime: number;
    #sigBufTime: number;

    public constructor(params: { SecretId: string; SecretKey: string }) {
        this.init(params);
    }

    private init(params: { SecretId: string; SecretKey: string }) {
        const { SecretId, SecretKey } = params;

        this.keydata = {
            SecretId,
            SecretKey,
        };

        this.config.sdkappid = SecretId;
        this.#userBuf = null;
    }

    public get header() {
        return this.headers;
    }

    public get random() {
        const now = Date.now();
        const randomStr = Math.random().toString().slice(2, 10);
        return parseInt(`${now}${randomStr}`);
    }

    public get usersig() {
        const { identifier, expireSeconds } = this.config;
        const now = Date.now();
        if (!this.#usersig) {
            this.#usersig = this.getSig(identifier, expireSeconds, null);
            this.#sigTime = now;
        }

        //  超过了过期时间,重新生成
        if (now > this.#sigTime + expireSeconds * 1000) {
            this.#usersig = this.getSig(identifier, expireSeconds, null);
            this.#sigTime = now;
        }

        return this.#usersig;
    }

    // public get userBufsig() {
    //     const { identifier, expireSeconds } = this.config;

    //     this.#userBufsig = this.getSig(
    //         identifier,
    //         expireSeconds,
    //         this.#userBuf,
    //     );

    //     return this.#userBufsig;
    // }

    // private get userBuf() {
    //     return this.#userBuf;
    // }

    private set userBuf(val: string | null) {
        this.#userBuf = val;
    }

    public getSig(
        userid: string,
        expire: number,
        userBuf: null | Buffer = null,
    ) {
        const nowTime = Math.floor(Date.now() / 1000);
        expire = parseInt(expire.toString());

        const sigDoc = {
            'TLS.ver': '2.0',
            'TLS.identifier': `${userid}`,
            'TLS.sdkappid': Number(this.config.sdkappid),
            'TLS.time': nowTime,
            'TLS.expire': expire,
        };

        let sig = '';
        let signStr = `TLS.identifier:${userid}\nTLS.sdkappid:${this.config.sdkappid}\nTLS.time:${nowTime}\nTLS.expire:${expire}\n`;
        const hmac = Crypto.createHmac('sha256', this.keydata.SecretKey);
        if (userBuf !== null) {
            const base64Buf = Buffer.from(userBuf).toString('base64');
            sigDoc['TLS.userbuf'] = base64Buf;

            signStr += `TLS.userbuf:${base64Buf}\n`;
        }
        sig = hmac.update(signStr).digest('base64');
        sigDoc['TLS.sig'] = sig;

        const compressed = Zlib.deflateSync(
            Buffer.from(JSON.stringify(sigDoc)),
        ).toString('base64');
        return compressed
            .replace(/\+/g, '*')
            .replace(/\//g, '-')
            .replace(/=/g, '_');
    }

    //  签名
    private sign(params: {
        header: {
            'content-type': string;
            host: string;
        };
        method: 'GET' | 'POST';
        data: { [key: string]: any };
    }) {
        const { header, method, data } = params;

        //  请求头信息
        const headerStr = Object.keys(header)
            .map(key => key.toLocaleLowerCase())
            .sort()
            .map(key => `${key}:${header[key]}`)
            .join('\n');

        //  请求头key
        const signHeaderStr = Object.keys(header)
            .map(key => key.toLocaleLowerCase())
            .sort()
            .join(';');

        let hashStr = '';
        let queryStr = '';
        const hashCrypto = Crypto.createHmac('sha256', '');
        if (method === 'GET') {
            hashStr = '';
            queryStr = new URLSearchParams(data).toString();
        } else {
            hashStr = hashCrypto.update(headerStr).digest('hex');
        }

        const signStr = `${method}\n/\n${queryStr}\n${headerStr}\n${signHeaderStr}\n${hashStr}`;
    }

    private sha256(message: string, secret = '', encoding = 'utf-8') {
        const hmac = Crypto.createHmac('sha256', secret);
        return hmac.update(message).digest('hex');
    }

    private getHash(message, encoding = 'hex') {
        const hash = Crypto.createHash('sha256');
        return hash.update(message).digest('hex');
    }

    public async request<T extends { [key: string]: any }>(params: {
        method: 'GET' | 'POST';
        path: string;
        data?: { [key: string]: any };
    }) {
        let { method, path, data = {} } = params;
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }

        const [_, ver, servicename, command] = path.split('/');

        const { domain, sdkappid, identifier, contenttype } = this.config;
        const random = this.random;
        const usersig = this.usersig;

        const res: AxiosResponse<ImResult & T> = await Axios({
            url: `https://${domain}${path}`,
            method,
            data,
            headers: {
                Host: domain,
            },
            params: {
                sdkappid,
                identifier,
                usersig,
                random,
                contenttype,
            },
            timeout: 3000,
        });

        const { ErrorCode, ErrorInfo, ActionStatus, ...response } = res.data;

        if (ActionStatus !== 'OK') {
            throw new Error(ErrorInfo);
        }

        return res.data;
    }

    // //  启动云端混流
    // public StartMCUMixTranscode(params: { path: string }) {}

    // //  结束云端混流
    // public StopMCUMixTranscode() {}

    // //  启动云端混流（字符串房间号）
    // public StartMCUMixTranscodeByStrRoomId() {}

    // //  结束云端混流（字符串房间号）
    // public StopMCUMixTranscodeByStrRoomId() {}
    // //  查询云端录制计费时长
    // public DescribeRecordStatistic() {}
    // //  查询音视频互动计费时长
    // public DescribeTrtcInteractiveTime() {}
    // //  查询旁路转码计费时长
    // public DescribeTrtcMcuTranscodeTime() {}
    // //  修改图片
    // public ModifyPicture() {}

    // //  通话质量监控相关接口
    // //  创建异常信息
    // public CreateTroubleInfo() {}
    // //  查询异常体验事件
    // public DescribeAbnormalEvent() {}
    // //  查询详细事件
    // public DescribeDetailEvent() {}
    // //  查询历史房间列表
    // public DescribeRoomInformation() {}
    // //  查询历史用户列表与通话指标
    // public DescribeCallDetail() {}
    // //  查询历史用户列表
    // public DescribeUserInformation() {}
    // //  查询历史房间和用户数
    // public DescribeHistoryScale() {}

    // //  房间管理相关接口
    // //  移出用户
    // public RemoveUser() {}
    // //  解散房间
    // public DismissRoom() {}
    // //  移出用户（字符串房间号）
    // public RemoveUserByStrRoomId() {}
    // //  解散房间（字符串房间号）
    // public DismissRoomByStrRoomId() {}

    public account_import(
        params: {
            Identifier: string;
            Nick?: string | undefined;
            FaceUrl?: string | undefined;
        },
        path: string = 'v4/im_open_login_svc/account_import',
    ) {
        return this.request<{ FailAccounts: Array<string> }>({
            method: 'POST',
            path,
            data: params,
        });
    }

    public multiaccount_import(
        params: { Accounts: string[] },
        path: string = 'v4/im_open_login_svc/multiaccount_import',
    ) {
        return this.request<{ FailAccounts: string[] }>({
            method: 'POST',
            path,
            data: params,
        });
    }

    public account_delete(
        params: { DeleteItem: { UserID: string }[]; UserID: string },
        path: string = 'v4/im_open_login_svc/account_delete',
    ) {
        return this.request<{
            ResultItem: {
                ResultCode: number;
                ResultInfo: string;
                UserID: string;
            }[];
        }>({ method: 'POST', path, data: params });
    }

    public account_check(
        params: { CheckItem: { UserID: string }[]; UserID: string },
        path: string = 'v4/im_open_login_svc/account_check',
    ) {
        return this.request<{
            ResultItem: any[];
            UserID: string;
            ResultCode: number;
            AccountStatus: string;
        }>({ method: 'POST', path, data: params });
    }

    public kick(
        params: { Identifier: string },
        path: string = 'v4/im_open_login_svc/kick',
    ) {
        return this.request({ method: 'POST', path, data: params });
    }

    public query_online_status(
        params: { To_Account: string[]; IsNeedDetail?: 0 | 1 },
        path: string = 'v4/openim/query_online_status',
    ) {
        const { To_Account, IsNeedDetail = 0 } = params;
        return this.request<{
            QueryResult: Array<{
                To_Account: string;
                Status: string;
                Detail: Array<{ Platform: string; Status: string }>;
            }>;
        }>({
            method: 'POST',
            path,
            data: { To_Account, IsNeedDetail },
        });
    }

    public sendmsg(
        params: ImMsgParams,
        path: string = 'v4/openim/sendmsg',
    ): Promise<
        ImResult & { ActionStatus: 'OK'; MsgTime: number; MsgKey: string }
    > {
        return this.request<
            ImResult & { ActionStatus: 'OK'; MsgTime: number; MsgKey: string }
        >({
            method: 'POST',
            path,
            data: params,
        });
    }

    public batchsendmsg(
        params: ImMsgParams,
        path: string = 'v4/openim/batchsendmsg',
    ): Promise<ImResult> {
        return this.request({ method: 'POST', path, data: params });
    }

    public importmsg(
        params: ImMsgParams,
        path: string = 'v4/openim/importmsg',
    ): Promise<ImResult> {
        return this.request({ method: 'POST', path, data: params });
    }

    public admin_getroammsg(
        params: {
            From_Account: string;
            To_Account: string;
            MaxCnt: number;
            MinTime: number;
            MaxTime: number;
        },
        path: string = 'v4/openim/admin_getroammsg',
    ): Promise<
        ImResult & {
            Complete: number;
            MsgCnt: number;
            LastMsgTime: number;
            LastMsgKey: string;
            MsgList: ImMsgParams[];
        }
    > {
        return this.request<
            ImResult & {
                Complete: number;
                MsgCnt: number;
                LastMsgTime: number;
                LastMsgKey: string;
                MsgList: ImMsgParams[];
            }
        >({
            method: 'POST',
            path,
            data: params,
        });
    }

    public admin_msgwithdraw(
        params: { From_Account: string; To_Account: string; MsgKey: string },
        path: string = 'v4/openim/admin_msgwithdraw',
    ): Promise<ImResult> {
        return this.request({ method: 'POST', path, data: params });
    }

    public admin_set_msg_read(
        params: { Report_Account: string; Peer_Account: string },
        path: string = 'get_c2c_unread_msg_num',
    ): Promise<ImResult> {
        return this.request({ method: 'POST', path, data: params });
    }

    public get_c2c_unread_msg_num(
        params: { To_Account: string },
        path: string,
    ): Promise<ImResult> {
        return this.request({ method: 'POST', path, data: params });
    }
}
