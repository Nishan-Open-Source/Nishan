import { ICommentCreateInput, ICommentUpdateInput, IDiscussionUpdateInput, NotionDiscourse } from '@nishans/discourse';
import { NotionOperations } from '@nishans/operations';
import { FilterType, FilterTypes, UpdateType, UpdateTypes } from '@nishans/traverser';
import { IComment, IDiscussion } from '@nishans/types';
import { INotionCoreOptions } from '../';
import { transformToMultiple } from '../utils';
import Comment from './Comment';
import NotionData from './Data';

export default class Discussion extends NotionData<IDiscussion, IDiscussionUpdateInput> {
	constructor (arg: INotionCoreOptions) {
		super({ ...arg, type: 'discussion' });
	}

	async createComments (args: ICommentCreateInput[]) {
		const props = this.getProps();
		const { comments, operations } = await NotionDiscourse.Comments.create(this.id, args, props);
		await NotionOperations.executeOperations(operations, this.getProps());
		return comments.map((comment) => new Comment({ ...props, id: comment.id }));
	}

	async getComment (arg?: FilterType<IComment>) {
		return (await this.getComments(transformToMultiple(arg), false))[0];
	}

	async getComments (args?: FilterTypes<IComment>, multiple?: boolean) {
		const props = this.getProps();
		return (await NotionDiscourse.Comments.get(this.id, args, { ...props, multiple })).map(
			(comment) => new Comment({ ...props, id: comment.id })
		);
	}

	async updateComment (arg: UpdateType<IComment, ICommentUpdateInput>) {
		return (await this.updateComments(transformToMultiple(arg), false))[0];
	}

	async updateComments (args: UpdateTypes<IComment, ICommentUpdateInput>, multiple?: boolean) {
		const props = this.getProps();
		return (await NotionDiscourse.Comments.update(this.id, args, { ...props, multiple })).map(
			(comment) => new Comment({ ...props, id: comment.id })
		);
	}

	async deleteComment (arg?: FilterType<IComment>) {
		return (await this.deleteComments(transformToMultiple(arg), false))[0];
	}

	async deleteComments (args?: FilterTypes<IComment>, multiple?: boolean) {
		const props = this.getProps();
		return (await NotionDiscourse.Comments.delete(this.id, args, { ...props, multiple })).map(
			(comment) => new Comment({ ...props, id: comment.id })
		);
	}
}
