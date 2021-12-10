export interface ImTrtcInterface {
    config: {
        ver: string;
        domain: string;
        servicename: string;
        command: string;
        sdkappid: string;
        identifier: string;
        usersig: string;
        random: string;
        contenttype: string;
    };

    headers: {
        'X-TC-Action': string; //    操作的接口名称
        'X-TC-Region': 'ap-beijing' | 'ap-guangzhou'; //    区域名称，地域参数
        'X-TC-Timestamp': string; //    时间戳，unix时间戳
        'X-TC-Version': string; //    版本号
        Authorization: 'TC3-HMAC-SHA256'; //    签名，见附录
        'X-TC-Token': string; //    业务级别的token，见附录
        'X-TC-Language': 'zh-CN' | 'en-US'; //    语言参数，默认值为zh-cn
    };

    keydata: {
        SecretId: string;
        SecretKey: string;
    };

    //  启动云端混流
    StartMCUMixTranscode(params: { path: string });

    //  结束云端混流
    StopMCUMixTranscode();

    //  启动云端混流（字符串房间号）
    StartMCUMixTranscodeByStrRoomId();

    //  结束云端混流（字符串房间号）
    StopMCUMixTranscodeByStrRoomId();
    //  查询云端录制计费时长
    DescribeRecordStatistic();
    //  查询音视频互动计费时长
    DescribeTrtcInteractiveTime();
    //  查询旁路转码计费时长
    DescribeTrtcMcuTranscodeTime();
    //  修改图片
    ModifyPicture();

    //  通话质量监控相关接口
    //  创建异常信息
    CreateTroubleInfo();
    //  查询异常体验事件
    DescribeAbnormalEvent();
    //  查询详细事件
    DescribeDetailEvent();
    //  查询历史房间列表
    DescribeRoomInformation();
    //  查询历史用户列表与通话指标
    DescribeCallDetail();
    //  查询历史用户列表
    DescribeUserInformation();
    //  查询历史房间和用户数
    DescribeHistoryScale();

    //  房间管理相关接口
    //  移出用户
    RemoveUser();
    //  解散房间
    DismissRoom();
    //  移出用户（字符串房间号）
    RemoveUserByStrRoomId();
    //  解散房间（字符串房间号）
    DismissRoomByStrRoomId();
}

export interface ImServer {
    //  #账号管理

    //  导入单个账号
    account_import(
        params: {
            Identifier: string;
            Nick?: string;
            FaceUrl?: string;
        },
        path: string,
    ): Promise<ImResult>;
    //  导入多个账号
    multiaccount_import(
        params: {
            Accounts: Array<string>;
        },
        path: string,
    ): Promise<ImResult & { FailAccounts: Array<string> }>;
    //  删除账号
    account_delete(
        params: {
            DeleteItem: Array<{ UserID: string }>;
            UserID: string;
        },
        path: string,
    ): Promise<
        ImResult & {
            ResultItem: Array<{
                ResultCode: number;
                ResultInfo: string;
                UserID: string;
            }>;
        }
    >;
    //  查询账号
    account_check(
        params: {
            CheckItem: Array<{ UserID: string }>;
            UserID: string;
        },
        path: string,
    ): Promise<
        ImResult & {
            ResultItem: Array<any>;
            UserID: string;
            ResultCode: number;
            AccountStatus: string;
        }
    >;
    //  失效账号登录状态
    kick(
        params: {
            Identifier: string;
        },
        path: string,
    ): Promise<ImResult>;
    //  查询账号在线状态
    query_online_status(
        params: {
            To_Account: Array<string>;
            IsNeedDetail: 0;
        },
        path: string,
    ): Promise<
        ImResult & {
            QueryResult: Array<{ To_Account: string; Status: string }>;
        }
    >;
    query_online_status(
        params: {
            To_Account: Array<string>;
            IsNeedDetail: 1;
        },
        path: string,
    ): Promise<
        ImResult & {
            QueryResult: Array<{
                To_Account: string;
                Status: string;
                Detail: Array<{ Platform: string; Status: string }>;
            }>;
        }
    >;

    // //  #单聊消息
    // //  单发单聊消息
    // query_online_status();
    // //  批量发单聊消息
    // batchsendmsg();
    // //  导入单聊消息
    // importmsg();
    // //  查询单聊消息
    // admin_getroammsg();
    // //  撤回单聊消息
    // admin_msgwithdraw();
    // //  设置单聊消息已读
    // admin_set_msg_read();
    // //  查询单聊消息计数
    // get_c2c_unread_msg_num();

    // //  #全员推送
    // //  全员推送
    // im_push();
    // //  设置应用属性名称
    // im_set_attr_name();
    // //  获取应用属性名称
    // im_get_attr_name();
    // //  获取用户属性
    // im_get_attr();
    // //  设置用户属性
    // im_set_attr();
    // //  删除用户属性
    // im_remove_attr();
    // //  获取用户标签
    // im_get_tag();
    // //  添加用户标签
    // im_add_tag();
    // //  删除用户标签
    // im_remove_tag();
    // //  删除用户所有标签
    // im_remove_all_tags();

    // //  #资料管理
    // //  设置资料
    // portrait_set();
    // //  拉取资料
    // portrait_get();

    // //  #关系链管理
    // //  添加好友
    // friend_add();
    // //  导入好友
    // friend_import();
    // //  更新好友
    // friend_update();
    // //  删除好友
    // friend_delete();
    // //  删除所有好友
    // friend_delete_all();
    // //  校验好友
    // friend_check();
    // //  拉取好友
    // friend_get();
    // //  拉取指定好友
    // friend_get_list();
    // //  添加黑名单
    // black_list_add();
    // //  删除黑名单
    // black_list_delete();
    // //  拉取黑名单
    // black_list_get();
    // //  校验黑名单
    // black_list_check();
    // //  添加分组
    // group_add();
    // //  删除分组
    // group_delete();
    // //  拉取分组
    // group_get();

    // //  #最近联系人
    // //  拉取会话列表
    // get_list();
    // //  删除单个会话
    // delete();

    // //  #群组管理
    // //  获取APP中的所有群组
    // get_appid_group_list();
    // //  创建群组
    // create_group();
    // //  获取群消息资料
    // get_group_info();
    // //  获取群成员详细资料
    // get_group_member_info();
    // //  修改群基础资料
    // modify_group_base_info();
    // //  增加群成员
    // add_group_member();
    // //  删除群成员
    // delete_group_member();
    // //  修改群成员资料
    // modify_group_member_info();
    // //  解散群组
    // destroy_group()
    // //  获取用户所加入的群组
    // get_joined_group_list();
    // //  查询用户在群组中的身份
    // get_role_in_group();
    // //  批量禁言和取消禁言
    // forbid_send_msg();
    // //  获取被禁言群成员列表
    // get_group_shutted_uin();
    // //  在群组中发送普通消息
    // send_group_msg();
    // //  在群组中发送系统通知
    // send_group_system_notification();
    // //  转让群主
    // change_group_owner();
    // //  撤回群消息
    // group_msg_recall();
    // //  导入群基础资料
    // import_group();
    // //  导入群消息
    // import_group_msg();
    // //  导入群成员
    // import_group_member();
    // //  设置成员未读消息计数
    // set_unread_msg_num();
    // //  撤回指定用户发送的消息
    // delete_group_msg_by_sender();
    // //  拉取群历史消息
    // group_msg_get_simple();
    // //  获取直播群的在线人数
    // get_online_member_num();

    // //  #全局禁言管理
    // //  设置全局禁言
    // setnospeaking();
    // //  查询全局禁言
    // getnospeaking();

    // //  #运营管理
    // //  拉取运营数据
    // getappinfo();
    // //  下载最近消息记录
    // get_history();
    // //  获取服务器IP地址
    // GetIPList();
}

export interface ImResult {
    ActionStatus: 'OK' | 'FAIL';
    ErrorInfo: string;
    ErrorCode: number;
}
