'use strict';
import * as _ from 'lodash';

export const BlocksSqlite = (dialect) => {
	dialect.blocks.add('offset', function(params) {
		var limit = '';

		if (_.isUndefined(params.limit)) {
			limit = dialect.buildBlock('limit', {limit: -1}) + ' ';
		}

		return limit + 'offset ' + dialect.builder._pushValue(params.offset);
	});
};
