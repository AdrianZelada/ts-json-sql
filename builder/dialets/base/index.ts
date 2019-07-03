export class Dialect{

    constructor(){}

    _wrapIdentifier(name: string) {}

    buildLogicalOperator(params: any) {}

    buildComparisonOperator(params: any) {}

    buildFetchingOperator(params: any) {}

    buildEndFetchingOperator(params: any) {}

    buildStateOperator(params: string) {}

    buildOperatorsGroup(params: string) {}

    buildOperator(params: string) {}

    buildCondition(params: string) {}

    buildModifier(params: string) {}

    buildBlock(params: string) {}

    buildTemplate(params: string) {}
}
