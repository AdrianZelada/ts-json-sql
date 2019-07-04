
import { BaseDialect} from "../base";
import {BlocksSqlite} from "./blocks";

export class SqliteDialect extends BaseDialect{
	constructor(builder){
		super(builder);
        BlocksSqlite(this);
	}
}