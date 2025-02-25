import Logger, { VerboseLevel } from "../../util/Logger";
import protobuf, { Root } from 'protobufjs';
import { resolve } from 'path';
const c = new Logger("Packet")
export default class Packet {
    public readonly cmdid: number;
    public readonly data: Buffer;
    private static root: Root = Packet.getRoot();
    public body: {} = {};

    public constructor(public readonly rawData: Buffer, public readonly protoName: string = "") {
        // Remove the header and metadata
        const metadataLength = rawData.readUInt16BE(6);
        this.data = rawData.subarray(12 + metadataLength, 12 + metadataLength + rawData.readUInt32BE(8));
        this.cmdid = this.rawData.readUInt16BE(4);

        this.protoName = this.protoName || CmdID[this.cmdid];
        if (this.protoName) {
            try {
                const Message = Packet.root.lookupTypeOrEnum(this.protoName);
                this.body = Message.decode(this.data);
            } catch (e) {
                c.warn(`Failed to decode ${this.protoName}`);
                if (Logger.VERBOSE_LEVEL >= VerboseLevel.ALL) {
                    c.error(e as Error, false);
                }
                c.debug(`Data: ${this.data.toString("hex")}`);
            }
        } else {
            c.error(`Unknown packet id ${this.cmdid}`);
        }
    }

    public static isValid(data: Buffer): boolean {
        // Buffer acting fucky so i'll just use good ol' string manipulation
        const str = data.toString('hex');
        return str.startsWith("01234567") && str.endsWith("89abcdef");
    }

    public static encode(name: PacketName, body: {}, customCmdId?: number): Packet | null {
        try {
            const cmdid = CmdID[name];
            const Message = Packet.root.lookupTypeOrEnum(name);

            const data = Buffer.from(Message.encode(body).finish());
            const packet = Buffer.allocUnsafe(16 + data.length);
            packet.writeUInt32BE(0x1234567);
            packet.writeUint16BE(customCmdId || cmdid, 4);
            packet.writeUint16BE(0, 6);
            packet.writeUint32BE(data.length, 8);
            data.copy(packet, 12);
            packet.writeUint32BE(0x89abcdef, 12 + data.length);

            return new Packet(packet, name);
        } catch (e) {
            c.error(e as Error);
            return null;
        }
    }

    private static getRoot(): Root {
        try {
            // Combined proto file with all definitions
            return protobuf.loadSync(resolve(__dirname, `../../data/proto/StarRail.proto`));
        } catch (e) {
            c.error("Failed to load proto root! Server will not be able to function properly. Please check your data/ folder.");
            c.error(e as Error, false);
            process.exit(1);
        }
    }

    public static fromEncodedBuffer(data: Buffer, name: PacketName): Buffer {
        const cmdid = CmdID[name];
        const packet = Buffer.allocUnsafe(16 + data.length);
        packet.writeUInt32BE(0x1234567);
        packet.writeUint16BE(cmdid, 4);
        packet.writeUint16BE(0, 6);
        packet.writeUint32BE(data.length, 8);
        data.copy(packet, 12);
        packet.writeUint32BE(0x89abcdef, 12 + data.length);
        return packet;
    }


}

export type PacketName = keyof typeof CmdID;

export enum CmdID {
    None = 0,
    PlayerLoginCsReq = 1,
    PlayerLoginScRsp = 2,
    PlayerLogoutCsReq = 3,
    PlayerLogoutScRsp = 4,
    PlayerGetTokenCsReq = 5,
    PlayerGetTokenScRsp = 6,
    PlayerKeepAliveNotify = 7,
    GmTalkScNotify = 8,
    PlayerKickOutScNotify = 9,
    GmTalkCsReq = 10,
    GmTalkScRsp = 11,
    ExchangeStaminaCsReq = 14,
    ExchangeStaminaScRsp = 15,
    GetAuthkeyCsReq = 16,
    GetAuthkeyScRsp = 17,
    RegionStopScNotify = 18,
    AntiAddictScNotify = 19,
    SetNicknameCsReq = 20,
    SetNicknameScRsp = 21,
    GetLevelRewardTakenListCsReq = 22,
    GetLevelRewardTakenListScRsp = 23,
    GetLevelRewardCsReq = 24,
    GetLevelRewardScRsp = 25,
    SyncTimeCsReq = 26,
    SyncTimeScRsp = 27,
    SetLanguageCsReq = 28,
    SetLanguageScRsp = 29,
    ServerAnnounceNotify = 30,
    SetHeroBasicTypeCsReq = 31,
    SetHeroBasicTypeScRsp = 32,
    GetHeroBasicTypeInfoCsReq = 33,
    GetHeroBasicTypeInfoScRsp = 34,
    GetHeroPathCsReq = 35,
    GetHeroPathScRsp = 36,
    HeroPathChangedNotify = 37,
    SetGenderCsReq = 38,
    SetGenderScRsp = 39,
    SetPlayerInfoCsReq = 40,
    SetPlayerInfoScRsp = 41,
    HeroBasicTypeChangedNotify = 42,
    QueryProductInfoCsReq = 43,
    QueryProductInfoScRsp = 44,
    ClientDownloadDataScNotify = 45,
    UpdateFeatureSwitchScNotify = 46,
    GetBasicInfoCsReq = 47,
    GetBasicInfoScRsp = 48,
    DailyRefreshNotify = 49,
    PVEBattleResultCsReq = 101,
    PVEBattleResultScRsp = 102,
    QuitBattleCsReq = 103,
    QuitBattleScRsp = 104,
    GetCurBattleInfoCsReq = 105,
    GetCurBattleInfoScRsp = 106,
    SyncClientResVersionCsReq = 107,
    SyncClientResVersionScRsp = 108,
    QuitBattleScNotify = 109,
    GetStageDataCsReq = 201,
    GetStageDataScRsp = 202,
    StageBeginCsReq = 203,
    StageBeginScRsp = 204,
    GetAvatarDataCsReq = 301,
    GetAvatarDataScRsp = 302,
    AvatarExpUpCsReq = 303,
    AvatarExpUpScRsp = 304,
    UnlockSkilltreeCsReq = 305,
    UnlockSkilltreeScRsp = 306,
    PromoteAvatarCsReq = 307,
    PromoteAvatarScRsp = 308,
    DressAvatarCsReq = 309,
    DressAvatarScRsp = 310,
    TakeOffEquipmentCsReq = 311,
    TakeOffEquipmentScRsp = 312,
    AddAvatarScNotify = 313,
    RankUpAvatarCsReq = 314,
    RankUpAvatarScRsp = 315,
    DressRelicAvatarCsReq = 316,
    DressRelicAvatarScRsp = 317,
    TakeOffRelicCsReq = 318,
    TakeOffRelicScRsp = 319,
    GetWaypointCsReq = 401,
    GetWaypointScRsp = 402,
    SetCurWaypointCsReq = 403,
    SetCurWaypointScRsp = 404,
    GetChapterCsReq = 405,
    GetChapterScRsp = 406,
    WaypointShowNewCsNotify = 407,
    TakeChapterRewardCsReq = 408,
    TakeChapterRewardScRsp = 409,
    GetBagCsReq = 501,
    GetBagScRsp = 502,
    PromoteEquipmentCsReq = 503,
    PromoteEquipmentScRsp = 504,
    LockEquipmentCsReq = 505,
    LockEquipmentScRsp = 506,
    UseItemCsReq = 507,
    UseItemScRsp = 508,
    RankUpEquipmentCsReq = 509,
    RankUpEquipmentScRsp = 510,
    ExpUpEquipmentCsReq = 511,
    ExpUpEquipmentScRsp = 512,
    ComposeItemCsReq = 513,
    ComposeItemScRsp = 514,
    ExpUpRelicCsReq = 515,
    ExpUpRelicScRsp = 516,
    LockRelicCsReq = 517,
    LockRelicScRsp = 518,
    SellItemCsReq = 519,
    SellItemScRsp = 520,
    RechargeSuccNotify = 521,
    PlayerSyncScNotify = 601,
    GetStageLineupCsReq = 701,
    GetStageLineupScRsp = 702,
    GetCurLineupDataCsReq = 703,
    GetCurLineupDataScRsp = 704,
    JoinLineupCsReq = 705,
    JoinLineupScRsp = 706,
    QuitLineupCsReq = 707,
    QuitLineupScRsp = 708,
    SwapLineupCsReq = 709,
    SwapLineupScRsp = 710,
    SyncLineupNotify = 711,
    GetLineupAvatarDataCsReq = 712,
    GetLineupAvatarDataScRsp = 713,
    ChangeLineupLeaderCsReq = 714,
    ChangeLineupLeaderScRsp = 715,
    SwitchLineupIndexCsReq = 716,
    SwitchLineupIndexScRsp = 717,
    SetLineupNameCsReq = 718,
    SetLineupNameScRsp = 719,
    GetAllLineupDataCsReq = 720,
    GetAllLineupDataScRsp = 721,
    VirtualLineupDestroyNotify = 722,
    GetMailCsReq = 801,
    GetMailScRsp = 802,
    MarkReadMailCsReq = 803,
    MarkReadMailScRsp = 804,
    DelMailCsReq = 805,
    DelMailScRsp = 806,
    TakeMailAttachmentCsReq = 807,
    TakeMailAttachmentScRsp = 808,
    NewMailScNotify = 809,
    GetQuestDataCsReq = 901,
    GetQuestDataScRsp = 902,
    TakeQuestRewardCsReq = 903,
    TakeQuestRewardScRsp = 904,
    TakeAchievementLevelRewardCsReq = 905,
    TakeAchievementLevelRewardScRsp = 906,
    GetMazeCsReq = 1001,
    GetMazeScRsp = 1002,
    ChooseMazeSeriesCsReq = 1003,
    ChooseMazeSeriesScRsp = 1004,
    ChooseMazeAbilityCsReq = 1005,
    ChooseMazeAbilityScRsp = 1006,
    EnterMazeCsReq = 1007,
    EnterMazeScRsp = 1008,
    MazeBuffScNotify = 1011,
    CastMazeSkillCsReq = 1012,
    CastMazeSkillScRsp = 1013,
    MazePlaneEventScNotify = 1014,
    EnterMazeByServerScNotify = 1015,
    GetMazeMapInfoCsReq = 1016,
    GetMazeMapInfoScRsp = 1017,
    GetMazeTimeOfDayCsReq = 1018,
    GetMazeTimeOfDayScRsp = 1019,
    SetMazeTimeOfDayCsReq = 1020,
    SetMazeTimeOfDayScRsp = 1021,
    DelMazeTimeOfDayCsReq = 1022,
    DelMazeTimeOfDayScRsp = 1023,
    ReturnStartAnchorCsReq = 1024,
    ReturnStartAnchorScRsp = 1025,
    FinishPlotCsReq = 1101,
    FinishPlotScRsp = 1102,
    GetMissionDataCsReq = 1201,
    GetMissionDataScRsp = 1202,
    FinishTalkMissionCsReq = 1203,
    FinishTalkMissionScRsp = 1204,
    MissionRewardScNotify = 1205,
    SyncTaskCsReq = 1206,
    SyncTaskScRsp = 1207,
    DailyTaskDataScNotify = 1208,
    TakeDailyTaskExtraRewardCsReq = 1209,
    TakeDailyTaskExtraRewardScRsp = 1210,
    DailyTaskRewardScNotify = 1211,
    MissionGroupWarnScNotify = 1212,
    FinishCosumeItemMissionCsReq = 1213,
    FinishCosumeItemMissionScRsp = 1214,
    GetMissionEventDataCsReq = 1215,
    GetMissionEventDataScRsp = 1216,
    MissionEventRewardScNotify = 1217,
    AcceptMissionEventCsReq = 1218,
    AcceptMissionEventScRsp = 1219,
    GetMissionStatusCsReq = 1220,
    GetMissionStatusScRsp = 1221,
    InterruptMissionEventCsReq = 1222,
    InterruptMissionEventScRsp = 1223,
    SetMissionEventProgressCsReq = 1224,
    SetMissionEventProgressScRsp = 1225,
    SubMissionRewardScNotify = 1226,
    EnterAdventureCsReq = 1301,
    EnterAdventureScRsp = 1302,
    SceneEntityMoveCsReq = 1401,
    SceneEntityMoveScRsp = 1402,
    InteractPropCsReq = 1403,
    InteractPropScRsp = 1404,
    SceneCastSkillCsReq = 1405,
    SceneCastSkillScRsp = 1406,
    GetCurSceneInfoCsReq = 1407,
    GetCurSceneInfoScRsp = 1408,
    SceneEntityUpdateScNotify = 1409,
    SceneEntityDisappearScNotify = 1410,
    SceneEntityMoveScNotify = 1411,
    SpringTransferCsReq = 1414,
    SpringTransferScRsp = 1415,
    UpdateBuffScNotify = 1416,
    DelBuffScNotify = 1417,
    SpringRefreshCsReq = 1418,
    SpringRefreshScRsp = 1419,
    LastSpringRefreshTimeNotify = 1420,
    ReturnLastTownCsReq = 1421,
    ReturnLastTownScRsp = 1422,
    SceneEnterStageCsReq = 1423,
    SceneEnterStageScRsp = 1424,
    EnterSectionCsReq = 1427,
    EnterSectionScRsp = 1428,
    SetCurInteractEntityCsReq = 1431,
    SetCurInteractEntityScRsp = 1432,
    RecoverAllLineupCsReq = 1433,
    RecoverAllLineupScRsp = 1434,
    SavePointsInfoNotify = 1435,
    StartCocoonStageCsReq = 1436,
    StartCocoonStageScRsp = 1437,
    EntityBindPropCsReq = 1438,
    EntityBindPropScRsp = 1439,
    SetClientPausedCsReq = 1440,
    SetClientPausedScRsp = 1441,
    UpdateBuffGroupStartScNotify = 1442,
    UpdateBuffGroupEndScNotify = 1443,
    ActivateFarmElementCsReq = 1445,
    ActivateFarmElementScRsp = 1446,
    GetSpringRecoverDataCsReq = 1447,
    GetSpringRecoverDataScRsp = 1448,
    SetSpringRecoverConfigCsReq = 1449,
    SetSpringRecoverConfigScRsp = 1450,
    SpringRecoverCsReq = 1451,
    SpringRecoverScRsp = 1452,
    HealPoolInfoNotify = 1453,
    SpringRecoverSingleAvatarCsReq = 1454,
    SpringRecoverSingleAvatarScRsp = 1455,
    GetShopListCsReq = 1501,
    GetShopListScRsp = 1502,
    BuyGoodsCsReq = 1503,
    BuyGoodsScRsp = 1504,
    GetTutorialCsReq = 1601,
    GetTutorialScRsp = 1602,
    GetTutorialGuideCsReq = 1603,
    GetTutorialGuideScRsp = 1604,
    UnlockTutorialCsReq = 1605,
    UnlockTutorialScRsp = 1606,
    UnlockTutorialGuideCsReq = 1607,
    UnlockTutorialGuideScRsp = 1608,
    FinishTutorialCsReq = 1609,
    FinishTutorialScRsp = 1610,
    FinishTutorialGuideCsReq = 1611,
    FinishTutorialGuideScRsp = 1612,
    GetChallengeCsReq = 1701,
    GetChallengeScRsp = 1702,
    StartChallengeCsReq = 1703,
    StartChallengeScRsp = 1704,
    LeaveChallengeCsReq = 1705,
    LeaveChallengeScRsp = 1706,
    ChallengeSettleNotify = 1707,
    FinishChallengeCsReq = 1708,
    FinishChallengeScRsp = 1709,
    GetCurChallengeCsReq = 1710,
    GetCurChallengeScRsp = 1711,
    ChallengeLineupNotify = 1712,
    TakeChallengeTargetRewardCsReq = 1713,
    TakeChallengeTargetRewardScRsp = 1714,
    GetRogueInfoCsReq = 1801,
    GetRogueInfoScRsp = 1802,
    StartRogueCsReq = 1803,
    StartRogueScRsp = 1804,
    EnterRogueCsReq = 1805,
    EnterRogueScRsp = 1806,
    LeaveRogueCsReq = 1807,
    LeaveRogueScRsp = 1808,
    SyncRogueBuffSelectInfoScNotify = 1809,
    SelectRogueBuffCsReq = 1810,
    SelectRogueBuffScRsp = 1811,
    RollRogueBuffCsReq = 1812,
    RollRogueBuffScRsp = 1813,
    EnterNextRogueRoomScNotify = 1814,
    SyncRogueFinishScNotify = 1815,
    PickRogueAvatarCsReq = 1816,
    PickRogueAvatarScRsp = 1817,
    AddRogueBuffScNotify = 1818,
    ReviveRogueAvatarCsReq = 1819,
    ReviveRogueAvatarScRsp = 1820,
    SaveRogueRecordCsReq = 1821,
    SaveRogueRecordScRsp = 1822,
    RecoverRogueStaminaCsReq = 1823,
    RecoverRogueStaminaScRsp = 1824,
    StartRogueChallengeCsReq = 1827,
    StartRogueChallengeScRsp = 1828,
    LeaveRogueChallengeCsReq = 1829,
    LeaveRogueChallengeScRsp = 1830,
    SyncRogueChallengeFinishScNotify = 1831,
    QuitRogueCsReq = 1832,
    QuitRogueScRsp = 1833,
    AppraisalRogueStoneCsReq = 1834,
    AppraisalRogueStoneScRsp = 1835,
    SyncRogueSeasonFinishScNotify = 1836,
    SyncRogueInfoChangeScNotify = 1837,
    AddRogueExtraBuffScNotify = 1838,
    EnterRogueMapRoomCsReq = 1839,
    EnterRogueMapRoomScRsp = 1840,
    EnterRogueNextLevelCsReq = 1841,
    EnterRogueNextLevelScRsp = 1842,
    SyncRogueMapRoomScNotify = 1843,
    SyncRoguePickAvatarScNotify = 1844,
    SetRogueBlessCsReq = 1845,
    SetRogueBlessScRsp = 1846,
    SyncRogueBlessScNotify = 1847,
    GetRogueShopInfoCsReq = 1848,
    GetRogueShopInfoScRsp = 1849,
    BuyRogueShopBuffCsReq = 1850,
    BuyRogueShopBuffScRsp = 1851,
    FinishRogueDialogueGroupCsReq = 1852,
    FinishRogueDialogueGroupScRsp = 1853,
    UnlockRogueRoomCsReq = 1856,
    UnlockRogueRoomScRsp = 1857,
    GetRogueGachaInfoCsReq = 1858,
    GetRogueGachaInfoScRsp = 1859,
    SetRogueGachaWishListCsReq = 1860,
    SetRogueGachaWishListScRsp = 1861,
    DoRogueGachaCsReq = 1862,
    DoRogueGachaScRsp = 1863,
    SyncRogueGachaRefreshScNotify = 1864,
    BuyRogueShopItemCsReq = 1865,
    BuyRogueShopItemScRsp = 1866,
    GetRogueAppraisalItemInfoCsReq = 1867,
    GetRogueAppraisalItemInfoScRsp = 1868,
    SyncRogueMiracleGetItemScNotify = 1869,
    SyncRogueQuestScNotify = 1870,
    GetRogueQuestRewardCsReq = 1871,
    GetRogueQuestRewardScRsp = 1872,
    GetGachaInfoCsReq = 1901,
    GetGachaInfoScRsp = 1902,
    DoGachaCsReq = 1903,
    DoGachaScRsp = 1904,
    GetPrestigeInfoCsReq = 2001,
    GetPrestigeInfoScRsp = 2002,
    PrestigeInfoChangeNotify = 2003,
    TakePrestigeLevelRewardCsReq = 2004,
    TakePrestigeLevelRewardScRsp = 2005,
    GetNpcTakenRewardCsReq = 2101,
    GetNpcTakenRewardScRsp = 2102,
    TakeTalkRewardCsReq = 2103,
    TakeTalkRewardScRsp = 2104,
    GetFirstTalkNpcCsReq = 2105,
    GetFirstTalkNpcScRsp = 2106,
    FinishFirstTalkNpcCsReq = 2107,
    FinishFirstTalkNpcScRsp = 2108,
    StartRaidCsReq = 2201,
    StartRaidScRsp = 2202,
    LeaveRaidCsReq = 2203,
    LeaveRaidScRsp = 2204,
    RaidInfoNotify = 2205,
    GetChallengeRaidInfoCsReq = 2206,
    GetChallengeRaidInfoScRsp = 2207,
    TakeChallengeRaidRewardCsReq = 2208,
    TakeChallengeRaidRewardScRsp = 2209,
    ChallengeRaidNotify = 2210,
    GetArchiveDataCsReq = 2301,
    GetArchiveDataScRsp = 2302,
    GetUpdatedArchiveDataCsReq = 2303,
    GetUpdatedArchiveDataScRsp = 2304,
    GetDialogueEventDataCsReq = 2401,
    GetDialogueEventDataScRsp = 2402,
    SelectDialogueEventCsReq = 2403,
    SelectDialogueEventScRsp = 2404,
    SyncDialogueEventDataScNotify = 2405,
    GetExpeditionDataCsReq = 2501,
    GetExpeditionDataScRsp = 2502,
    AcceptExpeditionCsReq = 2503,
    AcceptExpeditionScRsp = 2504,
    CancelExpeditionCsReq = 2505,
    CancelExpeditionScRsp = 2506,
    TakeExpeditionRewardCsReq = 2507,
    TakeExpeditionRewardScRsp = 2508,
    GetLoginActivityCsReq = 2601,
    GetLoginActivityScRsp = 2602,
    TakeLoginActivityRewardCsReq = 2603,
    TakeLoginActivityRewardScRsp = 2604,
    GetNpcMessageGroupCsReq = 2701,
    GetNpcMessageGroupScRsp = 2702,
    GetNpcStatusCsReq = 2703,
    GetNpcStatusScRsp = 2704,
    FinishItemIdCsReq = 2705,
    FinishItemIdScRsp = 2706,
    FinishSectionIdCsReq = 2707,
    FinishSectionIdScRsp = 2708,
}
