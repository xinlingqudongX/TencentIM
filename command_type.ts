import { ImGroupType, ImMsgBody } from 'define_type';

//  类型匹配
type CASE<T extends keyof ImCommandCallback> = ImCommandCallback[T];

//  回调命令列表
export enum CommandType {
    //  在线状态
    状态变更回调 = 'State.StateChange',

    //  资料关系链
    添加好友之前回调 = 'Sns.CallbackPrevFriendAdd',
    添加好友回应之前回调 = 'Sns.CallbackPrevFriendResponse',
    添加好友之后回调 = 'Sns.CallbackFriendAdd',
    删除好友之后回调 = 'Sns.CallbackFriendDelete',
    添加黑名单之后回调 = 'Sns.CallbackBlackListAdd',
    删除黑名单之后回调 = 'Sns.CallbackBlackListDelete',

    //  单聊消息
    发单聊消息之前回调 = 'C2C.CallbackBeforeSendMsg',
    发单聊消息之后回调 = 'C2C.CallbackAfterSendMsg',
    单聊消息已读上报后回调 = 'C2C.CallbackAfterMsgReport',
    单聊消息撤回后回调 = 'C2C.CallbackAfterMsgWithDraw',

    //  群组系统
    创建群组之前回调 = 'Group.CallbackBeforeCreateGroup',
    创建群组之后回调 = 'Group.CallbackAfterCreateGroup',
    申请入群之前回调 = 'Group.CallbackBeforeApplyJoinGroup',
    拉人入群之前回调 = 'Group.CallbackBeforeInviteJoinGroup',
    新成员入群之后回调 = 'Group.CallbackAfterNewMemberJoin',
    群成员离开之后回调 = 'Group.CallbackAfterMemberExit',
    群内发言之前回调 = 'Group.CallbackBeforeSendMsg',
    群内发言之后回调 = 'Group.CallbackAfterSendMsg',
    群组满员之后回调 = 'Group.CallbackAfterGroupFull',
    群组解散之后回调 = 'Group.CallbackAfterGroupDestroyed',
    群组资料修改之后回调 = 'Group.CallbackAfterGroupInfoChanged',
}

//  客户端平台类型
export enum ClientPlatform {
    RESTAPI = 'RESTAPI',
    Web = 'Web',
    Windows = 'Windows',
    Mac = 'Mac',
    Android = 'Android',
    iOS = 'iOS',
    IPad = 'IPad',
    Unknown = 'Unknown',
}

//  回调接口
export interface ImCommand {
    //  命令类型
    type: keyof ImCommandCallback;
    params: ImCommandParams;
    payload: CASE<ImCommand['type']>;
}

//  回调参数接口
export interface ImCommandParams {
    SdkAppid: string;
    CallbackCommand: CommandType;
    contenttype: 'json';
    ClientIP: string;
    OptPlatform: ClientPlatform;
}

export interface ImCommandCallback {
    [CommandType.状态变更回调]: {
        CallbackCommand: CommandType.状态变更回调;
        EventTime: number;
        Info: {
            Action: string;
            To_Account: string;
            Reason: string;
        };
        KickedDevice: Array<{
            Platform: ClientPlatform;
        }>;
    };
    [CommandType.添加好友之前回调]: {
        CallbackCommand: CommandType.添加好友之前回调;
        Requestser_Account: string;
        From_Account: string;
        FriendItem: Array<{
            To_Account: string;
            Remark: string;
            GroupName: string;
            AddSource: string;
            AddWording: string;
        }>;
        AddType: string;
        ForceAddFlags: number;
        EventTime: number;
    };
    [CommandType.添加好友回应之前回调]: {
        CallbackCommand: CommandType.添加好友回应之前回调;
        Requestser_Account: string;
        From_Account: string;
        ResponseFriendItem: Array<{
            To_Account: string;
            Remark: string;
            TagName: string;
            ResponseAction: string;
        }>;
        EventTime: number;
    };
    [CommandType.添加好友之后回调]: {
        CallbackCommand: CommandType.添加好友之后回调;
        PairList: Array<{
            From_Account: string;
            To_Account: string;
            Initiator_Account: string;
        }>;
        ClientCmd: string;
        Admin_Account: string;
        ForceFlag: number;
    };
    [CommandType.删除好友之后回调]: {
        CallbackCommand: CommandType.删除好友之后回调;
        PairList: Array<{
            From_Account: string;
            To_Account: string;
        }>;
    };
    [CommandType.添加黑名单之后回调]: {
        CallbackCommand: CommandType.添加黑名单之后回调;
        PairList: Array<{
            From_Account: string;
            To_Account: string;
        }>;
    };
    [CommandType.删除黑名单之后回调]: {
        CallbackCommand: CommandType.删除黑名单之后回调;
        PairList: Array<{
            From_Account: string;
            To_Account: string;
        }>;
    };
    [CommandType.发单聊消息之前回调]: {
        CallbackCommand: CommandType.发单聊消息之前回调;
        From_Account: string;
        To_Account: string;
        MsgRandom: number;
        MsgSeq: number;
        MsgTime: number;
        MsgBody: Array<ImMsgBody>;
        CloudCustomData: string;
        OnlineOnlyFlag: number;
        MsgKey: string;
    };
    [CommandType.发单聊消息之后回调]: {
        CallbackCommand: CommandType.发单聊消息之后回调;
        From_Account: string;
        To_Account: string;
        MsgRandom: number;
        MsgSeq: number;
        MsgTime: number;
        MsgBody: Array<ImMsgBody>;
        CloudCustomData: string;
        OnlineOnlyFlag: number;
        MsgKey: string;
        SendMsgResult: number;
        UnreadMsgNum: number;
        ErrorInfo: string;
    };
    [CommandType.单聊消息已读上报后回调]: {
        CallbackCommand: CommandType.单聊消息已读上报后回调;
        Report_Account: string;
        Peer_Account: string;
        LastReadTime: number;
        UnreadMsgNum: number;
    };
    [CommandType.单聊消息撤回后回调]: {
        CallbackCommand: CommandType.单聊消息撤回后回调;
        From_Account: string;
        To_Account: string;
        MsgKey: string;
        UnreadMsgNum: number;
    };
    [CommandType.创建群组之前回调]: {
        CallbackCommand: CommandType.创建群组之前回调;
        Operator_Account: string; // 操作者
        Owner_Account: string; // 群主
        Type: ImGroupType; //    群类型
        Name: string; //   群名称
        CreateGroupNum: number; //   创建群数量
        MemberList: Array<{
            Member_Account: string;
        }>;
    };
    [CommandType.创建群组之后回调]: {
        CallbackCommand: CommandType.创建群组之后回调;
        GroupId: string;
        Operator_Account: string;
        Owner_Account: string;
        Type: ImGroupType;
        Name: string;
        MemberList: Array<{
            Member_Account: string;
        }>;
        UserDefinedDataList: Array<{
            Key: string;
            Value: string;
        }>;
    };
    [CommandType.申请入群之前回调]: {
        CallbackCommand: CommandType.申请入群之前回调;
        GroupId: string;
        Type: ImGroupType;
        Requestor_Account: string;
    };
    [CommandType.拉人入群之前回调]: {
        CallbackCommand: CommandType.拉人入群之前回调;
        GroupId: string;
        Type: ImGroupType;
        Operator_Account: string;
        DestinationMembers: Array<{
            Member_Account: string;
        }>;
    };
    [CommandType.新成员入群之后回调]: {
        CallbackCommand: CommandType.新成员入群之后回调;
        GroupId: string;
        Type: ImGroupType;
        JoinType: ImGroupJoinType;
        NewMemberList: Array<{
            Member_Account: string;
        }>;
    };
    [CommandType.群成员离开之后回调]: {
        CallbackCommand: CommandType.群成员离开之后回调;
        GroupId: string;
        Type: ImGroupType;
        ExitType: ImGroupExitType;
        Operator_Account: string;
        ExitMemberList: Array<{
            Member_Account: string;
        }>;
    };
    [CommandType.群内发言之前回调]: {
        CallbackCommand: CommandType.群内发言之前回调;
        GroupId: string;
        Type: ImGroupType;
        From_Account: string;
        Operator_Account: string;
        Random: number;
        OnlineOnlyFlag: number;
        MsgBody: Array<ImMsgBody>;
    };
    [CommandType.群内发言之后回调]: {
        CallbackCommand: CommandType.群内发言之后回调;
        GroupId: string;
        Type: ImGroupType;
        From_Account: string;
        Operator_Account: string;
        Random: number;
        MsgSeq: number;
        MsgTime: number;
        OnlineOnlyFlag: number;
        MsgBody: Array<ImMsgBody>;
    };
    [CommandType.群组满员之后回调]: {
        CallbackCommand: CommandType.群组满员之后回调;
        GroupId: string;
    };
    [CommandType.群组解散之后回调]: {
        CallbackCommand: CommandType.群组解散之后回调;
        GroupId: string;
        Type: ImGroupType;
        Owner_Account: string;
        MemberList: Array<{
            Member_Account: string;
        }>;
    };
    [CommandType.群组资料修改之后回调]: {
        CallbackCommand: CommandType.群组资料修改之后回调;
        GroupId: string;
        Type: ImGroupType;
        Operator_Account: string;
        Introduction?: string;
        Notification?: string; // 群公告
        FaceUrl?: string; //  群头像
    };
}

//  群成员加入类型
export enum ImGroupJoinType {
    申请入群 = 'Apply',
    邀请入群 = 'Invited',
}

//  群成员退群类型
export enum ImGroupExitType {
    被踢出 = 'Kicked',
    主动退出 = 'Quit',
}
