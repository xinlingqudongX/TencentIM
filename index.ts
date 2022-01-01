import Crypto from 'crypto';
import { BinaryToTextEncoding } from 'crypto';
import Axios from 'axios';
import { AxiosResponse } from 'axios';
import * as tencentCloud from 'tencentcloud-sdk-nodejs';
import Zlib from 'zlib';
import {
    ImBlackListCheckType,
    ImFriendCheckType,
    ImFriendDeleteType,
    ImGroupType,
    ImMsgBody,
    ImMsgParams,
    ImProfileTag,
    ImResult,
    ImRtcRegion,
    ImServer,
    offlinePushInfo,
    RoomState,
} from 'define_type';

export default class ImServerSDK implements ImServer {
    public config: {
        ver: string;
        domain: string;
        servicename?: string;
        command?: string;
        // sdkappid: string;
        identifier: string;
        usersig?: string;
        // random?: string;
        contenttype: 'json';
        expireSeconds: number;
    } = {
        domain: 'console.tim.qq.com',
        ver: 'v4',
        // sdkappid: '',
        identifier: 'administrator',
        contenttype: 'json',
        expireSeconds: 60 * 60 * 24,
    };

    public headers: {
        'X-TC-Action'?: string; //    操作的接口名称
        'X-TC-Region'?: ImRtcRegion; //    区域名称，地域参数
        'X-TC-Timestamp'?: string; //    时间戳，unix时间戳
        'X-TC-Version'?: string; //    版本号
        Algorithm: 'TC3-HMAC-SHA256'; //    签名，见附录
        'X-TC-Token'?: string; //    业务级别的token，见附录
        'X-TC-Language': 'zh-CN' | 'en-US'; //    语言参数，默认值为zh-cn
    } = {
        Algorithm: 'TC3-HMAC-SHA256',
        'X-TC-Language': 'zh-CN',
    };

    public imConfig: {
        IMAppid: string;
        IMAppkey: string;
    };
    public rtcConfig: {
        RTCAppid: number;
        RTCAppkey: string;
    };

    #usersig: string;
    #userBuf: string | null;
    #userBufsig: string;
    #sigTime: number;
    #sigBufTime: number;

    public constructor(params: {
        IMAppid: string;
        IMAppkey: string;
        RTCAppid?: number;
        RTCAppkey?: string;
    }) {
        this.init(params);
    }

    private init(params: {
        IMAppid: string;
        IMAppkey: string;
        RTCAppid?: number;
        RTCAppkey?: string;
    }) {
        const { IMAppid, IMAppkey, RTCAppid, RTCAppkey } = params;

        this.imConfig = {
            IMAppid,
            IMAppkey,
        };

        if (RTCAppid && RTCAppkey) {
            this.rtcConfig = {
                RTCAppid,
                RTCAppkey,
            };
        }
        this.#userBuf = null;
    }

    // public get header() {
    //     return this.headers;
    // }

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

    // public async get userBufsig() {
    //     const { identifier, expireSeconds } = this.config;

    //     this.#userBufsig = this.getSig(
    //         identifier,
    //         expireSeconds,
    //         this.#userBuf,
    //     );

    //     return await this.#userBufsig;
    // }

    // private get userBuf() {
    //     return await this.#userBuf;
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
            'TLS.sdkappid': Number(this.imConfig.IMAppid),
            'TLS.time': nowTime,
            'TLS.expire': expire,
        };

        let sig = '';
        let signStr = `TLS.identifier:${userid}\nTLS.sdkappid:${this.imConfig.IMAppid}\nTLS.time:${nowTime}\nTLS.expire:${expire}\n`;
        const hmac = Crypto.createHmac('sha256', this.imConfig.IMAppkey);
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
        Algorithm: string;
    }) {
        const { header, method, data, Algorithm } = params;
        const { host } = header;
        const { RTCAppkey } = this.rtcConfig;

        if (!RTCAppkey) {
            throw new Error('RTCAppkey 未配置');
        }

        const date = new Date();
        const timestamp =
            // date.getTimezoneOffset() * 60 +
            parseInt((date.getTime() / 1000).toString());
        const today = date.toISOString().slice(0, 10);
        const [service, domain, other] = host.split('.');
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
        // const hashCrypto = Crypto.createHash('sha256');
        if (method === 'GET') {
            hashStr = '';
            queryStr = new URLSearchParams(data).toString();
        } else {
            hashStr = this.getHash(JSON.stringify(data));
        }

        const CanonicalRequest = `${method}\n/\n${queryStr}\n${headerStr}\n${signHeaderStr}\n${hashStr}`;
        const HashedCanonicalRequest =
            this.getHash(CanonicalRequest).toLocaleLowerCase();
        const credentialScope = `${today}/${
            other ? service : domain
        }/tc3_request`;
        const StringToSign = `${Algorithm}\n${timestamp}\n${credentialScope}\n${HashedCanonicalRequest}`;

        const secretDate = this.sha256(`TC3${RTCAppkey}`, today);
        const secretService = this.sha256(secretDate, other ? service : domain);
        const secretSign = this.sha256(secretService, 'tc3_request');
        const signature = this.sha256(secretSign, StringToSign, 'hex');
        return { signature, date, credentialScope, signHeaderStr, timestamp };
    }

    private sha256(
        message: string | Buffer,
        secret = '',
        encoding?: BinaryToTextEncoding,
    ) {
        const hmac = Crypto.createHmac('sha256', secret);
        return encoding
            ? hmac.update(message).digest(encoding)
            : hmac.update(message).digest();
    }

    private getHash(
        message: string | Buffer,
        encoding: BinaryToTextEncoding = 'hex',
    ) {
        const hash = Crypto.createHash('sha256');
        return hash.update(message).digest(encoding);
    }

    public async requests<T extends { [key: string]: any }>(params: {
        host?: string;
        Action: string;
        Version: string;
        Region: ImRtcRegion;
        data: { [key: string]: any };
    }) {
        let {
            host = 'trtc.tencentcloudapi.com',
            data,
            Version,
            Region,
            Action,
        } = params;
        const { Algorithm } = this.headers;

        const { RTCAppkey, RTCAppid } = this.rtcConfig;

        if (!RTCAppkey || !RTCAppid) {
            throw new Error('未配置RTCAppkey或RTCAppid');
        }

        const { signature, timestamp, credentialScope, signHeaderStr } =
            this.sign({
                header: {
                    'content-type': 'application/json; charset=utf-8',
                    host,
                },
                method: 'POST',
                data,
                Algorithm,
            });

        const res: AxiosResponse<{
            Response: T;
            Error?: {
                Code: string;
                Message: string;
            };
        }> = await Axios({
            url: `https://${host}`,
            method: 'POST',
            data: data,
            // params: {
            //     SdkAppId: RTCAppid,
            //     Action,
            //     Version,
            //     Region,
            // },
            headers: {
                host,
                'content-type': 'application/json; charset=utf-8',
                Authorization: `${Algorithm} Credential=${RTCAppid}/${credentialScope}, SignedHeaders=${signHeaderStr}, Signature=${signature}`,
                'X-TC-Action': Action,
                'X-TC-Version': Version,
                'X-TC-Timestamp': timestamp.toString(),
                'X-TC-Region': Region,
            },
        });

        return res.data;
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

        const { domain, identifier, contenttype } = this.config;
        const { IMAppid } = this.imConfig;
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
                sdkappid: IMAppid,
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
    // public async StartMCUMixTranscode(params: { path: string }) {}

    // //  结束云端混流
    // public async StopMCUMixTranscode() {}

    // //  启动云端混流（字符串房间号）
    // public async StartMCUMixTranscodeByStrRoomId() {}

    // //  结束云端混流（字符串房间号）
    // public async StopMCUMixTranscodeByStrRoomId() {}
    // //  查询云端录制计费时长
    // public async DescribeRecordStatistic() {}
    // //  查询音视频互动计费时长
    // public async DescribeTrtcInteractiveTime() {}
    // //  查询旁路转码计费时长
    // public async DescribeTrtcMcuTranscodeTime() {}
    // //  修改图片
    // public async ModifyPicture() {}

    // //  通话质量监控相关接口
    // //  创建异常信息
    // public async CreateTroubleInfo() {}
    // //  查询异常体验事件
    // public async DescribeAbnormalEvent() {}
    // //  查询详细事件
    // public async DescribeDetailEvent() {}
    // //  查询历史房间列表
    public async DescribeRoomInformation(params: {
        Action?: string;
        Version?: string;
        Region: ImRtcRegion;
        StartTime: number;
        EndTime: number;
        RoomId?: string;
        PageNumber?: string;
        PageSize?: string;
    }) {
        const {
            Action = 'DescribeRoomInformation',
            Version = '2018-07-12',
            Region,
            StartTime,
            EndTime,
            RoomId,
            PageNumber = '1',
            PageSize = '10',
        } = params;

        const { RTCAppid } = this.rtcConfig;

        return await this.requests<{
            Total: number;
            RoomList: Array<RoomState>;
            RequestId: string;
        }>({
            Action,
            Version,
            Region,
            data: {
                StartTime,
                EndTime,
                RoomId,
                PageNumber,
                PageSize,
                SdkAppId: RTCAppid,
            },
        });
    }
    // //  查询历史用户列表与通话指标
    // public async DescribeCallDetail() {}
    // //  查询历史用户列表
    // public async DescribeUserInformation() {}
    // //  查询历史房间和用户数
    // public async DescribeHistoryScale() {}

    //  房间管理相关接口
    //  移出用户
    public async RemoveUser(params: {
        Action?: string;
        Version?: string;
        Region: ImRtcRegion;
        RoomId: number;
        UserIds: Array<string>;
    }) {
        const {
            Action = 'RemoveUser',
            Version = '2019-07-22',
            Region,
            RoomId,
            UserIds,
        } = params;

        const { RTCAppid } = this.rtcConfig;

        return await this.requests<{
            RequestId: string;
        }>({
            data: {
                RoomId,
                UserIds,
                SdkAppId: RTCAppid,
            },
            Version,
            Region,
            Action,
        });
    }
    //  解散房间
    public async DismissRoom(params: {
        Action?: string;
        Version?: string;
        Region: ImRtcRegion;
        RoomId: number;
    }) {
        const {
            Action = 'DismissRoom',
            Version = '2019-07-22',
            Region,
            RoomId,
        } = params;

        const { RTCAppid } = this.rtcConfig;

        return await this.requests<{
            RequestId: string;
        }>({
            data: {
                RoomId,
                SdkAppId: RTCAppid,
            },
            Version,
            Region,
            Action,
        });
    }
    //  移出用户（字符串房间号）
    public async RemoveUserByStrRoomId(params: {
        Action?: string;
        Version?: string;
        Region: ImRtcRegion;
        RoomId: string;
        UserIds: Array<string>;
    }) {
        const {
            Action = 'RemoveUserByStrRoomId',
            Version = '2019-07-22',
            Region,
            RoomId,
            UserIds,
        } = params;

        const { RTCAppid } = this.rtcConfig;

        return await this.requests<{
            RequestId: string;
        }>({
            data: {
                RoomId,
                UserIds,
                SdkAppId: RTCAppid,
            },
            Version,
            Region,
            Action,
        });
    }
    //  解散房间（字符串房间号）
    public async DismissRoomByStrRoomId(params: {
        Action?: string;
        Version?: string;
        Region: ImRtcRegion;
        RoomId: string;
        UserIds: Array<string>;
    }) {
        const {
            Action = 'DismissRoomByStrRoomId',
            Version = '2019-07-22',
            Region,
            RoomId,
        } = params;

        const { RTCAppid } = this.rtcConfig;

        return await this.requests<{
            RequestId: string;
        }>({
            data: {
                RoomId,
                SdkAppId: RTCAppid,
            },
            Version,
            Region,
            Action,
        });
    }

    public async account_import(
        params: {
            Identifier: string;
            Nick?: string | undefined;
            FaceUrl?: string | undefined;
        },
        path: string = 'v4/im_open_login_svc/account_import',
    ) {
        return await this.request<{ FailAccounts: Array<string> }>({
            method: 'POST',
            path,
            data: params,
        });
    }

    public async multiaccount_import(
        params: { Accounts: string[] },
        path: string = 'v4/im_open_login_svc/multiaccount_import',
    ) {
        return await this.request<{ FailAccounts: string[] }>({
            method: 'POST',
            path,
            data: params,
        });
    }

    public async account_delete(
        params: { DeleteItem: { UserID: string }[]; UserID: string },
        path: string = 'v4/im_open_login_svc/account_delete',
    ) {
        return await this.request<{
            ResultItem: {
                ResultCode: number;
                ResultInfo: string;
                UserID: string;
            }[];
        }>({ method: 'POST', path, data: params });
    }

    public async account_check(
        params: { CheckItem: { UserID: string }[]; UserID: string },
        path: string = 'v4/im_open_login_svc/account_check',
    ) {
        return await this.request<{
            ResultItem: any[];
            UserID: string;
            ResultCode: number;
            AccountStatus: string;
        }>({ method: 'POST', path, data: params });
    }

    public async kick(
        params: { Identifier: string },
        path: string = 'v4/im_open_login_svc/kick',
    ) {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async query_online_status(
        params: { To_Account: string[]; IsNeedDetail?: 0 | 1 },
        path: string = 'v4/openim/query_online_status',
    ) {
        const { To_Account, IsNeedDetail = 0 } = params;
        return await this.request<{
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

    public async sendmsg(
        params: ImMsgParams,
        path: string = 'v4/openim/sendmsg',
    ): Promise<
        ImResult & { ActionStatus: 'OK'; MsgTime: number; MsgKey: string }
    > {
        return await this.request<
            ImResult & { ActionStatus: 'OK'; MsgTime: number; MsgKey: string }
        >({
            method: 'POST',
            path,
            data: params,
        });
    }

    public async batchsendmsg(
        params: ImMsgParams,
        path: string = 'v4/openim/batchsendmsg',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async importmsg(
        params: ImMsgParams,
        path: string = 'v4/openim/importmsg',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async admin_getroammsg(
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
        return await this.request<
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

    public async admin_msgwithdraw(
        params: { From_Account: string; To_Account: string; MsgKey: string },
        path: string = 'v4/openim/admin_msgwithdraw',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async admin_set_msg_read(
        params: { Report_Account: string; Peer_Account: string },
        path: string = 'v4/openim/admin_set_msg_read',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_c2c_unread_msg_num(
        params: { To_Account: string },
        path: string = 'v4/openim/get_c2c_unread_msg_num',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_push(
        params: {
            From_Account: string;
            MsgRandom: number;
            MsgBody: ImMsgBody | ImMsgBody[];
            Condition: {
                TagsAnd?: string[] | undefined;
                TagsOr?: string[] | undefined;
                AttrsAnd?: { [key: string]: string } | undefined;
                AttrsOr?: { [key: string]: string } | undefined;
            };
            offlinePushInfo?: offlinePushInfo | undefined;
        },
        path: string = 'v4/all_member_push/im_push',
    ): Promise<ImResult & { TaskId: string }> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_set_attr_name(
        params: { AttrNames: { [key: string]: string } },
        path: string = 'v4/all_member_push/im_set_attr_name',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_get_attr_name(
        params: {},
        path: string = 'v4/all_member_push/im_get_attr_name',
    ): Promise<ImResult & { AttrNames: { [key: string]: string } }> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_get_attr(
        params: { To_Account: string[] },
        path: string = 'v4/all_member_push/im_get_attr',
    ): Promise<
        ImResult & {
            UserAttrs: {
                To_Account: string;
                Attrs: { [key: string]: string };
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_set_attr(
        params: {
            UserAttrs: {
                To_Account: string;
                Attrs: { [key: string]: string };
            }[];
        },
        path: string = 'v4/all_member_push/im_set_attr',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_remove_attr(
        params: { UserAttrs: { To_Account: string; Attrs: string[] }[] },
        path: string = 'v4/all_member_push/im_remove_attr',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_get_tag(
        params: { To_Account: string[] },
        path: string = 'v4/all_member_push/im_get_tag',
    ): Promise<
        ImResult & { UserTags: { To_Account: string; Tags: string[] }[] }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_add_tag(
        params: { UserTags: { To_Account: string; Tags: string[] }[] },
        path: string = 'v4/all_member_push/im_add_tag',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_remove_tag(
        params: { UserTags: { To_Account: string; Tags: string[] }[] },
        path: string = 'v4/all_member_push/im_remove_tag',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async im_remove_all_tags(
        params: { To_Account: string[] },
        path: string = 'v4/all_member_push/im_remove_all_tags',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async portrait_set(
        params: {
            From_Account: string;
            ProfileItem: {
                Tag: ImProfileTag;
                Value: string | number | Buffer;
            }[];
        },
        path: string = 'v4/profile/portrait_set',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async portrait_get(
        params: { To_Account: string[]; TagList: ImProfileTag[] },
        path: string = 'v4/profile/portrait_get',
    ): Promise<
        ImResult & {
            UserProfileItem: {
                To_Account: string;
                ProfileItem: {
                    Tag: ImProfileTag;
                    Value: string | number | Buffer;
                }[];
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async friend_add(
        params: {
            From_Account: string;
            AddFriendItem: {
                To_Account: string;
                AddSource: string;
                GroupName?: string | undefined;
                Remark?: string | undefined;
                AddWording?: string | undefined;
            }[];
        },
        path: string = 'v4/sns/friend_add',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async friend_import(
        params: {
            From_Account: string;
            AddFriendItem: {
                To_Account: string;
                AddSource: string;
                GroupName?: string | undefined;
                Remark?: string | undefined;
                AddWording?: string | undefined;
                CustomItem?:
                    | { Tag: string; Value: string | number }[]
                    | undefined;
            }[];
        },
        path: string = 'v4/sns/friend_import',
    ): Promise<
        ImResult & {
            ResultItem: {
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }[];
            Fail_Account: string[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async friend_update(
        params: {
            From_Account: string;
            UpdateItem: {
                To_Account: string;
                SnsItem: { Tag: string; Value: string | number }[];
            }[];
        },
        path: string = 'v4/sns/friend_update',
    ): Promise<
        ImResult & {
            ResultItem: {
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }[];
            Fail_Account: string[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async friend_delete(
        params: {
            From_Account: string;
            To_Account: string[];
            DeleteType: ImFriendDeleteType;
        },
        path: string = 'v4/sns/friend_delete',
    ): Promise<
        ImResult & {
            ResultItem: {
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async friend_delete_all(
        params: { From_Account: string; DeleteType: ImFriendDeleteType },
        path: string = 'v4/sns/friend_delete_all',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async friend_check(
        params: {
            From_Account: string;
            To_Account: string[];
            CheckType: ImFriendCheckType;
        },
        path: string = 'v4/sns/friend_check',
    ): Promise<
        ImResult & {
            InfoItem: {
                To_Account: string;
                Relation: string;
                ResultCode: number;
                ResultInfo: string;
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async friend_get(
        params: {
            From_Account: string;
            StartIndex: number;
            StandardSequence?: number | undefined;
            CustomSequence?: number | undefined;
        },
        path: string = 'v4/sns/friend_get',
    ): Promise<
        ImResult & {
            UserDataItem: {
                To_Account: string;
                ValueItem: { Tag: string; Value: string | number }[];
            }[];
            StandardSequence: number;
            CustomSequence: number;
            FriendNum: number;
            CompleteFlag: number;
            NextStartIndex: number;
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async friend_get_list(
        params: {
            From_Account: string;
            To_Account: string[];
            TagList: string[];
        },
        path: string = 'v4/sns/friend_get_list',
    ): Promise<
        ImResult & {
            InfoItem: {
                To_Account: string;
                SnsProfileItem: { Tag: string; Value: string | number }[];
            }[];
            Fail_Account: string[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async black_list_add(
        params: { From_Account: string; To_Account: string[] },
        path: string = 'v4/sns/black_list_add',
    ): Promise<
        ImResult & {
            ResultItem: {
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async black_list_delete(
        params: { From_Account: string; To_Account: string[] },
        path: string = 'v4/sns/black_list_delete',
    ): Promise<
        ImResult & {
            ResultItem: {
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async black_list_get(
        params: {
            From_Account: string;
            StartIndex: number;
            MaxLimited: number;
            LastSequence: number;
        },
        path: string = 'v4/sns/black_list_get',
    ): Promise<
        ImResult & {
            BlackListItem: { To_Account: string; AddBlackTimeStamp: number }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async black_list_check(
        params: {
            From_Account: string;
            To_Account: string[];
            CheckType: ImBlackListCheckType;
        },
        path: string = 'v4/sns/black_list_check',
    ): Promise<
        ImResult & {
            BlackListItem: {
                To_Account: string;
                Relation: string;
                ResultCode: number;
                ResultInfo: string;
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async group_add(
        params: {
            From_Account: string;
            GroupName: string[];
            To_Account?: string[] | undefined;
        },
        path: string = 'v4/sns/group_add',
    ): Promise<ImResult & { CurrentSequence: number }> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async group_delete(
        params: { From_Account: string; GroupName: string[] },
        path: string = 'v4/sns/group_delete',
    ): Promise<ImResult & { CurrentSequence: number }> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async group_get(
        params: {
            From_Account: string;
            LastSequence: number;
            NeedFriend?: string | undefined;
            GroupName?: string[] | undefined;
        },
        path: string = 'v4/sns/group_get',
    ): Promise<
        ImResult & { ResultItem: { GroupName: string; FriendNumber: number }[] }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_list(
        params: {
            From_Account: string;
            TimeStamp: number;
            StartIndex: number;
            TopTimeStamp: number;
            TopStartIndex: number;
            AssistFlags: number;
        },
        path: string = 'v4/recentcontact/get_list',
    ): Promise<
        ImResult & {
            CompleteFlag: number;
            TimeStamp: number;
            StartIndex: number;
            TopTimeStamp: number;
            TopStartIndex: number;
            SessionItem: {
                Type: number;
                To_Account?: string | undefined;
                MsgTime: number;
                TopFlag: number;
                GoupId?: string | undefined;
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async delete(
        params: {
            From_Account: string;
            To_Account: string;
            Type: number;
            ClearRamble: number;
        },
        path: string = 'v4/recentcontact/delete',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_appid_group_list(
        params: {
            Limit?: number | undefined;
            Next?: number | undefined;
            GroupType: ImGroupType;
        },
        path: string = 'v4/group_open_http_svc/get_appid_group_list',
    ): Promise<
        ImResult & {
            TotalCount: number;
            GroupList: { GroupId: string }[];
            Next: number;
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async create_group(
        params: {
            Owner_Account: string;
            Type: ImGroupType;
            Name: string;
            Introduction?: string | undefined;
            Notification?: string | undefined;
            FaceUrl?: string | undefined;
            MaxMemberCount?: number | undefined;
            ApplyJoinOption?: string | undefined;
            MemberList: {
                Member_Account: string;
                Role?: 'Admin' | undefined;
                AppMemberDefinedData?:
                    | { Key: string; Value: string | Buffer }[]
                    | undefined;
            }[];
            GroupId?: string | undefined;
            AppDefinedData?:
                | { Key: string; Value: string | Buffer }[]
                | undefined;
        },
        path: string = 'v4/group_open_http_svc/create_group',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_group_info(
        params: {
            GroupIdList: string[];
            ResponseFilter?:
                | {
                      GroupBaseFilter?: string[] | undefined;
                      MemberInfoFilter?: string[] | undefined;
                      AppDefinedDataFilter_Group?: string[] | undefined;
                      AppDefinedDataFilter_GroupMember?: string[] | undefined;
                  }
                | undefined;
        },
        path: string = 'v4/group_open_http_svc/get_group_info',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_group_member_info(
        params: {
            GroupId: string;
            Limit?: number | undefined;
            Offset?: number | undefined;
            MemberInfoFilter?: string[] | undefined;
            MemberRoleFilter?: string[] | undefined;
            AppDefinedDataFilter_GroupMember?: string[] | undefined;
        },
        path: string = 'v4/group_open_http_svc/get_group_member_info',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async modify_group_base_info(
        params: {
            GroupId: string;
            Name?: string | undefined;
            Introduction?: string | undefined;
            Notification?: string | undefined;
            FaceUrl?: string | undefined;
            MaxMemberCount?: number | undefined;
            ApplyJoinOption?: string | undefined;
            ShutUpAllMember?: 'On' | 'Off' | undefined;
            AppDefinedData?:
                | { Key: string; Value: string | Buffer }[]
                | undefined;
        },
        path: string = 'v4/group_open_http_svc/modify_group_base_info',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async add_group_member(
        params: {
            GroupId: string;
            MemberList: { Member_Account: string }[];
            Silence?: number | undefined;
        },
        path: string = 'v4/group_open_http_svc/add_group_member',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async delete_group_member(
        params: {
            GroupId: string;
            MemberToDel_Account: string[];
            Silence?: number | undefined;
            Reason?: string | undefined;
        },
        path: string = 'v4/group_open_http_svc/delete_group_member',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async modify_group_member_info(
        params: {
            GroupId: string;
            Member_Account: string;
            Role?: 'Admin' | undefined;
        },
        path: string = 'v4/group_open_http_svc/modify_group_member_info',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public destroy_group(
        params: { GroupId: string },
        path: string = 'v4/group_open_http_svc/destroy_group',
    ): Promise<ImResult> {
        return this.request({ method: 'POST', path, data: params });
    }

    public async get_joined_group_list(
        params: {
            Member_Account: string;
            Limit?: number | undefined;
            Offset?: number | undefined;
            GroupType?: ImGroupType | undefined;
        },
        path: string = 'v4/group_open_http_svc/get_joined_group_list',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_role_in_group(
        params: { GroupId: string; User_Account: string[] },
        path: string = 'v4/group_open_http_svc/get_role_in_group',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async forbid_send_msg(
        params: {
            GroupId: string;
            Members_Account: string[];
            ShutUpTime: number;
        },
        path: string = 'v4/group_open_http_svc/forbid_send_msg',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_group_shutted_uin(
        params: { GroupId: string },
        path: string = 'v4/group_open_http_svc/get_group_shutted_uin',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async send_group_msg(
        params: {
            GroupId: string;
            From_Account: string;
            Random: number;
            MsgBody: ImMsgBody[];
        },
        path: string = 'v4/group_open_http_svc/send_group_msg',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async send_group_system_notification(
        params: {
            GroupId: string;
            Content: string;
            ToMembers_Account?: string[] | undefined;
        },
        path: string = 'v4/group_open_http_svc/send_group_system_notification',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async change_group_owner(
        params: { GroupId: string; NewOwner_Account: string },
        path: string = 'v4/group_open_http_svc/change_group_owner',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async group_msg_recall(
        params: { GroupId: string; MsgSeqList: { MsgSeq: number }[] },
        path: string = 'v4/group_open_http_svc/group_msg_recall',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async import_group(
        params: {
            Owner_Account: string;
            Type: ImGroupType;
            Name: string;
            CreateTime?: number | undefined;
            Introduction?: string | undefined;
            Notification?: string | undefined;
            FaceUrl?: string | undefined;
            MaxMemberCount?: number | undefined;
            ApplyJoinOption?: string | undefined;
        },
        path: string = 'v4/group_open_http_svc/import_group',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async import_group_msg(
        params: {
            GroupId: string;
            RecentContactFlag: number;
            MsgList: ImMsgBody[];
        },
        path: string = 'v4/group_open_http_svc/import_group_msg',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async import_group_member(
        params: {
            GroupId: string;
            MemberList: {
                Member_Account: string;
                Role?: string | undefined;
                JoinTime?: number | undefined;
                UnreadMsgNum?: number | undefined;
            }[];
        },
        path: string = 'v4/group_open_http_svc/import_group_member',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async set_unread_msg_num(
        params: {
            GroupId: string;
            Member_Account: string;
            UnreadMsgNum: number;
        },
        path: string = 'v4/group_open_http_svc/set_unread_msg_num',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async delete_group_msg_by_sender(
        params: { GroupId: string; Sender_Account: string },
        path: string = 'v4/group_open_http_svc/delete_group_msg_by_sender',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async group_msg_get_simple(
        params: {
            GroupId: string;
            ReqMsgNumber: number;
            ReqMsgSeq?: number | undefined;
        },
        path: string = 'v4/group_open_http_svc/group_msg_get_simple',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_online_member_num(
        params: { GroupId: string },
        path: string = 'v4/group_open_http_svc/get_online_member_num',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async setnospeaking(
        params: {
            Set_Account: string;
            C2CmsgNospeakingTime: number;
            GroupmsgNospeakingTime: number;
        },
        path: string = 'v4/openconfigsvr/setnospeaking',
    ): Promise<ImResult> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async getnospeaking(
        params: { Get_Account: string },
        path: string = 'v4/openconfigsvr/getnospeaking',
    ): Promise<
        ImResult & {
            C2CmsgNospeakingTime: number;
            GroupmsgNospeakingTime: number;
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async getappinfo(
        params: { RequestField?: string[] | undefined },
        path: string = 'v4/openconfigsvr/getappinfo',
    ): Promise<ImResult & { Result: { APNSMsgNum: string }[] }> {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async get_history(
        params: { ChatType: string; MsgTime: number },
        path: string = 'v4/open_msg_svc/get_history',
    ): Promise<
        ImResult & {
            File: {
                URL: string;
                ExpieTime: string;
                FileSize: number;
                FileMD5: string;
                GzipSize: number;
                GzipMD5: string;
            }[];
        }
    > {
        return await this.request({ method: 'POST', path, data: params });
    }

    public async GetIPList(
        params: {},
        path: string = 'v4/ConfigSvc/GetIPList',
    ): Promise<ImResult & { IPList: string[] }> {
        return await this.request({ method: 'POST', path, data: params });
    }
}
