
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
