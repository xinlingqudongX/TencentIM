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

    //  单发单聊消息 同步到from_account
    sendmsg(
        params: ImMsgParams,
        path: string,
    ): Promise<
        ImResult & { ActionStatus: 'OK'; MsgTime: number; MsgKey: string }
    >;
    //  批量发单聊消息
    batchsendmsg(params: ImMsgParams, path: string): Promise<ImResult>;
    //  导入单聊消息
    importmsg(params: ImMsgParams, path: string): Promise<ImResult>;
    //  查询单聊消息
    admin_getroammsg(
        params: {
            From_Account: string;
            To_Account: string;
            MaxCnt: number;
            MinTime: number;
            MaxTime: number;
        },
        path: string,
    ): Promise<
        ImResult & {
            Complete: number;
            MsgCnt: number;
            LastMsgTime: number;
            LastMsgKey: string;
            MsgList: Array<ImMsgParams>;
        }
    >;
    //  撤回单聊消息
    admin_msgwithdraw(
        params: {
            From_Account: string;
            To_Account: string;
            MsgKey: string;
        },
        path: string,
    ): Promise<ImResult>;
    //  设置单聊消息已读
    admin_set_msg_read(
        params: { Report_Account: string; Peer_Account: string },
        path: string,
    ): Promise<ImResult>;
    //  查询单聊消息计数
    get_c2c_unread_msg_num(
        params: { To_Account: string },
        path: string,
    ): Promise<ImResult>;

    //  #全员推送
    //  全员推送
    im_push(
        params: {
            From_Account: string;
            MsgRandom: number;
            MsgBody: ImMsgBody | Array<ImMsgBody>;
            Condition: {
                TagsAnd?: Array<string>;
                TagsOr?: Array<string>;
                AttrsAnd?: { [key: string]: string };
                AttrsOr?: { [key: string]: string };
            };
            offlinePushInfo?: offlinePushInfo;
        },
        path: string,
    ): Promise<ImResult & { TaskId: string }>;
    //  设置应用属性名称
    im_set_attr_name(
        params: { AttrNames: { [key: string]: string } },
        path: string,
    ): Promise<ImResult>;
    //  获取应用属性名称
    im_get_attr_name(
        params: {},
        path: string,
    ): Promise<ImResult & { AttrNames: { [key: string]: string } }>;
    //  获取用户属性
    im_get_attr(
        params: { To_Account: Array<string> },
        path: string,
    ): Promise<
        ImResult & {
            UserAttrs: Array<{
                To_Account: string;
                Attrs: { [key: string]: string };
            }>;
        }
    >;
    //  设置用户属性
    im_set_attr(
        params: {
            UserAttrs: Array<{
                To_Account: string;
                Attrs: { [key: string]: string };
            }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  删除用户属性
    im_remove_attr(
        params: {
            UserAttrs: Array<{ To_Account: string; Attrs: Array<string> }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  获取用户标签
    im_get_tag(
        params: {
            To_Account: Array<string>;
        },
        path: string,
    ): Promise<
        ImResult & {
            UserTags: Array<{
                To_Account: string;
                Tags: Array<string>;
            }>;
        }
    >;
    //  添加用户标签
    im_add_tag(
        params: {
            UserTags: Array<{
                To_Account: string;
                Tags: Array<string>;
            }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  删除用户标签
    im_remove_tag(
        params: {
            UserTags: Array<{ To_Account: string; Tags: Array<string> }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  删除用户所有标签
    im_remove_all_tags(
        params: { To_Account: Array<string> },
        path: string,
    ): Promise<ImResult>;

    //  #资料管理
    //  设置资料
    portrait_set(
        params: {
            From_Account: string;
            ProfileItem: Array<{
                Tag: ImProfileTag;
                Value: string | number | Buffer;
            }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  拉取资料
    portrait_get(
        params: { To_Account: Array<string>; TagList: Array<ImProfileTag> },
        path: string,
    ): Promise<
        ImResult & {
            UserProfileItem: Array<{
                To_Account: string;
                ProfileItem: Array<{
                    Tag: ImProfileTag;
                    Value: string | number | Buffer;
                }>;
            }>;
        }
    >;

    //  #关系链管理
    //  添加好友
    friend_add(
        params: {
            From_Account: string;
            AddFriendItem: Array<{
                To_Account: string;
                AddSource: string;
                GroupName?: string;
                Remark?: string;
                AddWording?: string;
            }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  导入好友
    friend_import(
        params: {
            From_Account: string;
            AddFriendItem: Array<{
                To_Account: string;
                AddSource: string;
                GroupName?: string;
                Remark?: string;
                AddWording?: string;
                CustomItem?: Array<{
                    Tag: string;
                    Value: string | number;
                }>;
            }>;
        },
        path: string,
    ): Promise<
        ImResult & {
            ResultItem: Array<{
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }>;
            Fail_Account: Array<string>;
        }
    >;
    //  更新好友
    friend_update(
        params: {
            From_Account: string;
            UpdateItem: Array<{
                To_Account: string;
                SnsItem: Array<{
                    Tag: string;
                    Value: string | number;
                }>;
            }>;
        },
        path: string,
    ): Promise<
        ImResult & {
            ResultItem: Array<{
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }>;
            Fail_Account: Array<string>;
        }
    >;
    //  删除好友
    friend_delete(
        params: {
            From_Account: string;
            To_Account: Array<string>;
            DeleteType: ImFriendDeleteType;
        },
        path: string,
    ): Promise<
        ImResult & {
            ResultItem: Array<{
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }>;
        }
    >;
    //  删除所有好友
    friend_delete_all(
        params: {
            From_Account: string;
            DeleteType: ImFriendDeleteType;
        },
        path: string,
    ): Promise<ImResult>;
    //  校验好友
    friend_check(
        params: {
            From_Account: string;
            To_Account: Array<string>;
            CheckType: ImFriendCheckType;
        },
        path: string,
    ): Promise<
        ImResult & {
            InfoItem: Array<{
                To_Account: string;
                Relation: string;
                ResultCode: number;
                ResultInfo: string;
            }>;
        }
    >;
    //  拉取好友
    friend_get(
        params: {
            From_Account: string;
            StartIndex: number;
            StandardSequence?: number;
            CustomSequence?: number;
        },
        path: string,
    ): Promise<
        ImResult & {
            UserDataItem: Array<{
                To_Account: string;
                ValueItem: Array<{
                    Tag: string;
                    Value: string | number;
                }>;
            }>;
            StandardSequence: number;
            CustomSequence: number;
            FriendNum: number;
            CompleteFlag: number;
            NextStartIndex: number;
        }
    >;
    //  拉取指定好友
    friend_get_list(
        params: {
            From_Account: string;
            To_Account: Array<string>;
            TagList: Array<string>;
        },
        path: string,
    ): Promise<
        ImResult & {
            InfoItem: Array<{
                To_Account: string;
                SnsProfileItem: Array<{
                    Tag: string;
                    Value: string | number;
                }>;
            }>;
            Fail_Account: Array<string>;
        }
    >;
    //  添加黑名单
    black_list_add(
        params: {
            From_Account: string;
            To_Account: Array<string>;
        },
        path: string,
    ): Promise<
        ImResult & {
            ResultItem: Array<{
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }>;
        }
    >;
    //  删除黑名单
    black_list_delete(
        params: {
            From_Account: string;
            To_Account: Array<string>;
        },
        path: string,
    ): Promise<
        ImResult & {
            ResultItem: Array<{
                To_Account: string;
                ResultCode: number;
                ResultInfo: string;
            }>;
        }
    >;
    //  拉取黑名单
    black_list_get(
        params: {
            From_Account: string;
            StartIndex: number;
            MaxLimited: number;
            LastSequence: number;
        },
        path: string,
    ): Promise<
        ImResult & {
            BlackListItem: Array<{
                To_Account: string;
                AddBlackTimeStamp: number;
            }>;
        }
    >;
    //  校验黑名单
    black_list_check(
        params: {
            From_Account: string;
            To_Account: Array<string>;
            CheckType: ImBlackListCheckType;
        },
        path: string,
    ): Promise<
        ImResult & {
            BlackListItem: Array<{
                To_Account: string;
                Relation: string;
                ResultCode: number;
                ResultInfo: string;
            }>;
        }
    >;
    //  添加分组
    group_add(
        params: {
            From_Account: string;
            GroupName: Array<string>;
            To_Account?: Array<string>;
        },
        path: string,
    ): Promise<
        ImResult & {
            CurrentSequence: number;
        }
    >;
    //  删除分组
    group_delete(
        params: {
            From_Account: string;
            GroupName: Array<string>;
        },
        path: string,
    ): Promise<
        ImResult & {
            CurrentSequence: number;
        }
    >;
    //  拉取分组
    group_get(
        params: {
            From_Account: string;
            LastSequence: number;
            NeedFriend?: string;
            GroupName?: Array<string>;
        },
        path: string,
    ): Promise<
        ImResult & {
            ResultItem: Array<{
                GroupName: string;
                FriendNumber: number;
            }>;
        }
    >;

    //  #最近联系人
    //  拉取会话列表
    get_list(
        params: {
            From_Account: string;
            TimeStamp: number;
            StartIndex: number;
            TopTimeStamp: number;
            TopStartIndex: number;
            AssistFlags: number;
        },
        path: string,
    ): Promise<
        ImResult & {
            CompleteFlag: number;
            TimeStamp: number;
            StartIndex: number;
            TopTimeStamp: number;
            TopStartIndex: number;
            SessionItem: Array<{
                Type: number;
                To_Account?: string;
                MsgTime: number;
                TopFlag: number;
                GoupId?: string;
            }>;
        }
    >;
    //  删除单个会话
    delete(
        params: {
            From_Account: string;
            To_Account: string;
            Type: number;
            ClearRamble: number;
        },
        path: string,
    ): Promise<ImResult>;

    //  #群组管理
    //  获取APP中的所有群组
    get_appid_group_list(
        params: {
            Limit?: number;
            Next?: number;
            GroupType: ImGroupType;
        },
        path: string,
    ): Promise<
        ImResult & {
            TotalCount: number;
            GroupList: Array<{ GroupId: string }>;
            Next: number;
        }
    >;
    //  创建群组
    create_group(
        params: {
            Owner_Account: string;
            Type: ImGroupType;
            Name: string;
            Introduction?: string; //    群组简介
            Notification?: string; //    群公告
            FaceUrl?: string; //    群头像URL
            MaxMemberCount?: number; //    群组最大成员数
            ApplyJoinOption?: string; //    申请加群处理方式
            MemberList: Array<{
                Member_Account: string;
                Role?: 'Admin';
                AppMemberDefinedData?: Array<{
                    Key: string;
                    Value: string | Buffer;
                }>;
            }>;
            GroupId?: string;
            AppDefinedData?: Array<{
                Key: string;
                Value: string | Buffer;
            }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  获取群消息资料
    get_group_info(
        params: {
            GroupIdList: Array<string>;
            ResponseFilter?: {
                GroupBaseFilter?: Array<string>;
                MemberInfoFilter?: Array<string>;
                AppDefinedDataFilter_Group?: Array<string>;
                AppDefinedDataFilter_GroupMember?: Array<string>;
            };
        },
        path: string,
    ): Promise<ImResult>;
    //  获取群成员详细资料
    get_group_member_info(
        params: {
            GroupId: string;
            Limit?: number;
            Offset?: number;
            MemberInfoFilter?: Array<string>;
            MemberRoleFilter?: Array<string>;
            AppDefinedDataFilter_GroupMember?: Array<string>;
        },
        path: string,
    ): Promise<ImResult>;
    //  修改群基础资料
    modify_group_base_info(
        params: {
            GroupId: string;
            Name?: string;
            Introduction?: string; //    群组简介
            Notification?: string; //    群公告
            FaceUrl?: string; //    群头像URL
            MaxMemberCount?: number; //    群组最大成员数
            ApplyJoinOption?: string; //    申请加群处理方式
            ShutUpAllMember?: 'On' | 'Off';
            AppDefinedData?: Array<{
                Key: string;
                Value: string | Buffer;
            }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  增加群成员
    add_group_member(
        params: {
            GroupId: string;
            MemberList: Array<{
                Member_Account: string;
            }>;
            Silence?: number; // 是否静默加人
        },
        path: string,
    ): Promise<ImResult>;
    //  删除群成员
    delete_group_member(
        params: {
            GroupId: string;
            MemberToDel_Account: Array<string>;
            Silence?: number; // 是否静默删人
            Reason?: string; //  删人原因
        },
        path: string,
    ): Promise<ImResult>;
    //  修改群成员资料
    modify_group_member_info(
        params: {
            GroupId: string;
            Member_Account: string;
            Role?: 'Admin';
        },
        path: string,
    ): Promise<ImResult>;
    //  解散群组
    destroy_group(
        params: {
            GroupId: string;
        },
        path: string,
    ): Promise<ImResult>;
    //  获取用户所加入的群组
    get_joined_group_list(
        params: {
            Member_Account: string;
            Limit?: number;
            Offset?: number;
            GroupType?: ImGroupType;
        },
        path: string,
    ): Promise<ImResult>;
    //  查询用户在群组中的身份
    get_role_in_group(
        params: {
            GroupId: string;
            User_Account: Array<string>;
        },
        path: string,
    ): Promise<ImResult>;
    //  批量禁言和取消禁言
    forbid_send_msg(
        params: {
            GroupId: string;
            Members_Account: Array<string>;
            ShutUpTime: number; //  为0时表示取消禁言
        },
        path: string,
    ): Promise<ImResult>;
    //  获取被禁言群成员列表
    get_group_shutted_uin(
        params: {
            GroupId: string;
        },
        path: string,
    ): Promise<ImResult>;
    //  在群组中发送普通消息
    send_group_msg(
        params: {
            GroupId: string;
            From_Account: string;
            Random: number;
            MsgBody: Array<ImMsgBody>;
        },
        path: string,
    ): Promise<ImResult>;
    //  在群组中发送系统通知
    send_group_system_notification(
        params: {
            GroupId: string;
            Content: string;
            ToMembers_Account?: Array<string>;
        },
        path: string,
    ): Promise<ImResult>;
    //  转让群主
    change_group_owner(
        params: {
            GroupId: string;
            NewOwner_Account: string;
        },
        path: string,
    ): Promise<ImResult>;
    //  撤回群消息
    group_msg_recall(
        params: {
            GroupId: string;
            MsgSeqList: Array<{ MsgSeq: number }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  导入群基础资料
    import_group(
        params: {
            Owner_Account: string;
            Type: ImGroupType;
            Name: string;
            CreateTime?: number;
            Introduction?: string; //    群组简介
            Notification?: string; //    群公告
            FaceUrl?: string; //    群头像URL
            MaxMemberCount?: number; //    群组最大成员数
            ApplyJoinOption?: string; //    申请加群处理方式
        },
        path: string,
    ): Promise<ImResult>;
    //  导入群消息
    import_group_msg(
        params: {
            GroupId: string;
            RecentContactFlag: number;
            MsgList: Array<ImMsgBody>;
        },
        path: string,
    ): Promise<ImResult>;
    //  导入群成员
    import_group_member(
        params: {
            GroupId: string;
            MemberList: Array<{
                Member_Account: string;
                Role?: string;
                JoinTime?: number;
                UnreadMsgNum?: number;
            }>;
        },
        path: string,
    ): Promise<ImResult>;
    //  设置成员未读消息计数
    set_unread_msg_num(
        params: {
            GroupId: string;
            Member_Account: string;
            UnreadMsgNum: number;
        },
        path: string,
    ): Promise<ImResult>;
    //  撤回指定用户发送的消息
    delete_group_msg_by_sender(
        params: {
            GroupId: string;
            Sender_Account: string;
        },
        path: string,
    ): Promise<ImResult>;
    //  拉取群历史消息
    group_msg_get_simple(
        params: {
            GroupId: string;
            ReqMsgNumber: number;
            ReqMsgSeq?: number;
        },
        path: string,
    ): Promise<ImResult>;
    //  获取直播群的在线人数
    get_online_member_num(
        params: {
            GroupId: string;
        },
        path: string,
    ): Promise<ImResult>;

    //  #全局禁言管理
    //  设置全局禁言
    setnospeaking(
        params: {
            Set_Account: string;
            C2CmsgNospeakingTime: number;
            GroupmsgNospeakingTime: number;
        },
        path: string,
    ): Promise<ImResult>;
    //  查询全局禁言
    getnospeaking(
        params: {
            Get_Account: string;
        },
        path: string,
    ): Promise<
        ImResult & {
            C2CmsgNospeakingTime: number;
            GroupmsgNospeakingTime: number;
        }
    >;

    //  #运营管理
    //  拉取运营数据
    getappinfo(
        params: {
            RequestField?: Array<string>;
        },
        path: string,
    ): Promise<ImResult & { Result: Array<{ APNSMsgNum: string }> }>;
    //  下载最近消息记录
    get_history(
        params: {
            ChatType: string;
            MsgTime: number;
        },
        path: string,
    ): Promise<
        ImResult & {
            File: Array<{
                URL: string;
                ExpieTime: string;
                FileSize: number;
                FileMD5: string;
                GzipSize: number;
                GzipMD5: string;
            }>;
        }
    >;
    //  获取服务器IP地址
    GetIPList(
        params: {},
        path: string,
    ): Promise<ImResult & { IPList: Array<string> }>;
}

export interface ImResult {
    ActionStatus: 'OK' | 'FAIL';
    ErrorInfo: string;
    ErrorCode: number;
    ErrorDisplay?: string; // 详细的客户端展示信息
}

//  IM消息类型
export enum ImMsgType {
    文本消息 = 'TIMTextElem',
    地理位置消息 = 'TIMLocationElem',
    表情消息 = 'TIMFaceElem',
    自定义消息 = 'TIMCustomElem',
    语音消息 = 'TIMSoundElem',
    图片消息 = 'TIMImageElem',
    文件消息 = 'TIMFileElem',
    视频消息 = 'TIMVideoFileElem',
}

//  IM消息体
export interface ImMsgContent {
    [ImMsgType.文本消息]: {
        Text: string;
    };
    [ImMsgType.地理位置消息]: {
        Desc: string;
        Latitude: number;
        Longitude: number;
    };
    [ImMsgType.表情消息]: {
        Index: number;
        Data: string;
    };
    [ImMsgType.自定义消息]: {
        Data: string;
        Desc: string;
        Ext: string;
        Sound: string;
    };
    [ImMsgType.语音消息]: {
        Url?: string;
        UUID: string;
        Size: number;
        Second: number;
        Download_Flag?: number;
    };
    [ImMsgType.图片消息]: {
        UUID: string;
        ImageFormat: number;
        ImageInfoArray: Array<{
            Type: number;
            Size: number;
            Width: number;
            Height: number;
            URL: string;
        }>;
    };
    [ImMsgType.文件消息]: {
        Url?: string;
        UUID: string;
        FileSize: number;
        FileName: string;
        Download_Flag?: number;
    };
    [ImMsgType.视频消息]: {
        VideoUrl?: string;
        VideoUUID: string;
        VideoSize: number;
        VideoSecond: number;
        VideoFormat: string;
        VideoDownloadFlag?: number;
        ThumbUrl?: string;
        ThumbUUID: string;
        ThumbSize: number;
        ThumbWidth: number;
        ThumbHeight: number;
        ThumbFormat: string;
        ThumbDownloadFlag?: number;
    };
}

//  IM图像类型
export enum ImImageType {
    原图 = 1,
    大图,
    缩略图,
}

export interface ImMsgBody {
    MsgType: keyof ImMsgContent;
    MsgContent: CASE<ImMsgBody['MsgType']> | Array<CASE<ImMsgBody['MsgType']>>;
}

//  类型匹配
type CASE<T extends keyof ImMsgContent> = ImMsgContent[T];

export interface ImMsgParams {
    SyncOtherMachine?: 1 | 2;
    From_Account?: string;
    To_Account: string;
    MsgLifeTime?: number; // 消息保存秒数
    MsgSeq?: number;
    MsgRandom: number;
    MsgTimeStamp?: number;
    ForbidCallbackControl?: Array<string>; // 禁止回调控制选项
    SendMsgControl?: Array<string>; // 发送控制选项
    MsgBody: Array<ImMsgBody>;
    CloudCustomData?: string;
    OfflinePushInfo?: {
        PushFlag: number;
        Desc: string; // 离线推送内容
        Ext: string; // 离线推送透传
        AndroidInfo: {
            Sound: string; // 铃音
        };
        ApnsInfo: {
            Sound: string; // 推送声音
            BadgeMode: number; // 0计数 1 不计数
            Title: string; // 推送标题
            SubTitle: string; // 副标题
            Image: string; //    图片地址
        };
    };
}

export interface offlinePushInfo {
    PushFlag: number;
    Desc: string; // 离线推送内容
    Ext: string; // 离线推送透传
    AndroidInfo: {
        Sound: string; // 铃音
    };
    ApnsInfo: {
        Sound: string; // 推送声音
        BadgeMode: number; // 0计数 1 不计数
        Title: string; // 推送标题
        SubTitle: string; // 副标题
        Image: string; //    图片地址
    };
}

export enum ImProfileTag {
    昵称 = 'Tag_Profile_IM_Nick',
    性别 = 'Tag_Profile_IM_Gender',
    生日 = 'Tag_Profile_IM_BirthDay',
    所在地 = 'Tag_Profile_IM_Location',
    个性签名 = 'Tag_Profile_IM_SelfSignature',
    加好友验证方式 = 'Tag_Profile_IM_AllowType',
    语言 = 'Tag_Profile_IM_Language',
    头像URL = 'Tag_Profile_IM_Image',
    消息设置 = 'Tag_Profile_IM_MsgSettings',
    管理员禁止加好友标识 = 'Tag_Profile_IM_AdminForbidType',
    等级 = 'Tag_Profile_IM_Level',
    角色 = 'Tag_Profile_IM_Role',
}

//  删除好友
export enum ImFriendDeleteType {
    单向删除好友 = 'Delete_Type_Single',
    双向删除好友 = 'ImFriendDeleteTypeBoth',
}

//  校验好友
export enum ImFriendCheckType {
    单向检验好友关系 = 'CheckResult_Type_Single',
    双向检验好友关系 = 'CheckResult_Type_Both',
}

//  校验黑名单
export enum ImBlackListCheckType {
    单向检验黑名单关系 = 'BlackCheckResult_Type_Single',
    双向检验黑名单关系 = 'BlackCheckResult_Type_Both',
}

//  群组类型
export enum ImGroupType {
    好友工作群 = 'Private',
    公开群 = 'Public',
    会议群 = 'ChatRoom',
    音视频聊天室 = 'AVChatRoom',
    在线成员广播大群 = 'Community',
}

//  RTC地域类型
export enum ImRtcRegion {
    华北地区北京 = 'ap-beijing',
    华南地区广州 = 'ap-guangzhou',
}

//  房间状态
export interface RoomState {
    CommId: string; //   通话ID
    RoomString: string; //   房间号
    CreateTime: number; //   创建时间
    DestoryTime: number; //   销毁时间
    IsFinished: boolean; //   是否结束
    UserId: string; //   房间创建者ID
}
