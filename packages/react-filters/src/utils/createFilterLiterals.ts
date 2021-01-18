export const createEmptyFilter = (): any => ({
	property: 'title',
	filter: {
		operator: 'string_is',
		value: {
			type: 'exact',
			value: ''
		}
	}
});

export const createEmptyFilterGroup = (): any => ({
	filters: [],
	operator: 'and'
});