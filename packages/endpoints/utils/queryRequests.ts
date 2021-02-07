import {
	GetPageVisitsParams,
	GetPageVisitsResult,
	GetUserSharedPagesParams,
	GetUserSharedPagesResult,
	GetUserTasksResult,
	GetPublicPageDataParams,
	GetPublicPageDataResult,
	GetPublicSpaceDataParams,
	GetPublicSpaceDataResult,
	GetSubscriptionDataParams,
	GetSubscriptionDataResult,
	LoadBlockSubtreeParams,
	LoadBlockSubtreeResult,
	GetGenericEmbedBlockDataParams,
	GetGenericEmbedBlockDataResult,
	GetUploadFileUrlParams,
	GetUploadFileUrlResult,
	GetGoogleDriveAccountsResult,
	GetBackLinksForBlockResult,
	FindUserResult,
	SyncRecordValuesParams,
	SyncRecordValuesResult,
	QueryCollectionParams,
	QueryCollectionResult,
	LoadUserContentResult,
	LoadPageChunkParams,
	LoadPageChunkResult,
	GetSpacesResult,
	GetBackLinksForBlockParams,
	FindUserParams,
	GetJoinableSpacesResult,
	IsUserDomainJoinableResult,
	IsEmailEducationResult,
	GetUserNotificationsResult,
	GetUserNotificationsParams,
	GetTasksParams,
	GetTasksResult,
	RecordPageVisitResult,
	RecordPageVisitParams
} from '@nishans/types';
import { Configs } from '../src';
import { sendRequest } from './';

export async function getPageVisits (params: GetPageVisitsParams, configs?: Partial<Configs>) {
	return await sendRequest<GetPageVisitsResult>('getPageVisits', params, configs);
}

export async function getUserSharedPages (params: GetUserSharedPagesParams, configs?: Partial<Configs>) {
	return await sendRequest<GetUserSharedPagesResult>('getUserSharedPages', params, configs);
}

export async function getUserTasks (configs?: Partial<Configs>) {
	return await sendRequest<GetUserTasksResult>('getUserTasks', {}, configs);
}

export async function getPublicPageData (params: GetPublicPageDataParams, configs?: Partial<Configs>) {
	return await sendRequest<GetPublicPageDataResult>('getPublicPageData', params, configs);
}

export async function getPublicSpaceData (params: GetPublicSpaceDataParams, configs?: Partial<Configs>) {
	return await sendRequest<GetPublicSpaceDataResult>('getPublicSpaceData', params, configs);
}

export async function getSubscriptionData (params: GetSubscriptionDataParams, configs?: Partial<Configs>) {
	return await sendRequest<GetSubscriptionDataResult>('getSubscriptionData', params, configs);
}

export async function loadBlockSubtree (params: LoadBlockSubtreeParams, configs?: Partial<Configs>) {
	return await sendRequest<LoadBlockSubtreeResult>('loadBlockSubtree', params, configs);
}

export async function getSpaces (configs?: Partial<Configs>) {
	return await sendRequest<GetSpacesResult>('getSpaces', {}, configs);
}

export async function getGenericEmbedBlockData (params: GetGenericEmbedBlockDataParams, configs?: Partial<Configs>) {
	return await sendRequest<GetGenericEmbedBlockDataResult>('getGenericEmbedBlockData', params, configs);
}

export async function getUploadFileUrl (params: GetUploadFileUrlParams, configs?: Partial<Configs>) {
	return await sendRequest<GetUploadFileUrlResult>('getUploadFileUrl', params, configs);
}

export async function getGoogleDriveAccounts (configs?: Partial<Configs>) {
	return await sendRequest<GetGoogleDriveAccountsResult>('getGoogleDriveAccounts', {}, configs);
}

export async function getBacklinksForBlock (params: GetBackLinksForBlockParams, configs?: Partial<Configs>) {
	return await sendRequest<GetBackLinksForBlockResult>('getBacklinksForBlock', params, configs);
}

export async function findUser (params: FindUserParams, configs?: Partial<Configs>) {
	return await sendRequest<FindUserResult>('findUser', params, configs);
}

export async function syncRecordValues (params: SyncRecordValuesParams, configs?: Partial<Configs>) {
	return await sendRequest<SyncRecordValuesResult>('syncRecordValues', params, configs);
}

export async function queryCollection (params: QueryCollectionParams, configs?: Partial<Configs>) {
	return await sendRequest<QueryCollectionResult>('queryCollection', params, configs);
}

export async function loadUserContent (configs?: Partial<Configs>) {
	return await sendRequest<LoadUserContentResult>('loadUserContent', {}, configs);
}

export async function loadPageChunk (params: LoadPageChunkParams, configs?: Partial<Configs>) {
	return await sendRequest<LoadPageChunkResult>('loadPageChunk', params, configs);
}

export async function recordPageVisit (params: RecordPageVisitParams, configs?: Partial<Configs>) {
	return await sendRequest<RecordPageVisitResult>('recordPageVisit', params, configs);
}

export async function getJoinableSpaces (configs?: Partial<Configs>) {
	return await sendRequest<GetJoinableSpacesResult>('getJoinableSpaces', {}, configs);
}

export async function isUserDomainJoinable (configs?: Partial<Configs>) {
	return await sendRequest<IsUserDomainJoinableResult>('isUserDomainJoinable', {}, configs);
}

export async function isEmailEducation (configs?: Partial<Configs>) {
	return await sendRequest<IsEmailEducationResult>('isEmailEducation', {}, configs);
}

export async function getUserNotifications (params: GetUserNotificationsParams, configs?: Partial<Configs>) {
	return await sendRequest<GetUserNotificationsResult>('getUserNotifications', params, configs);
}

export async function getTasks (params: GetTasksParams, configs?: Partial<Configs>) {
	return await sendRequest<GetTasksResult>('getTasks', params, configs);
}
