import * as _ from 'lodash';
import {ValuesStore} from "../../utils/values-store";
import {Templates} from "./templates";
import {Blocks} from "./blocks";
import {Operators} from "./operators";
import {Modifiers} from "./modifiers";
import {ObjectValidation as objectUtils} from "../../utils/object";

 let blockRegExp = /\{([a-z0-9]+)\}(.|$)/ig;

export class BaseDialect{
    builder: any;
    templates: any;
    blocks: any;
    operators: any;
    modifiers: any;
    identifierPartsRegexp: any;
    wrappedIdentifierPartRegexp: any;
    config = {
        identifierPrefix: '"',
        identifierSuffix: '"'
    };
    constructor(builder){
        this.builder = builder;

        this.templates = new ValuesStore();
        this.blocks = new ValuesStore();
        this.operators = {
            comparison: new ValuesStore(),
            logical: new ValuesStore(),
            fetching: new ValuesStore(),
            state: new ValuesStore()
        };
        this.modifiers = new ValuesStore();

        // init templates
        Templates(this);

        // init blocks
        Blocks(this);

        // init operators
        Operators(this);

        // init modifiers
        Modifiers(this);

        this.identifierPartsRegexp = new RegExp(
          '(\\' + this.config.identifierPrefix + '[^\\' + this.config.identifierSuffix + ']*\\' +
          this.config.identifierSuffix + '|[^\\.]+)', 'g'
        );
        this.wrappedIdentifierPartRegexp = new RegExp(
          '^\\' + this.config.identifierPrefix + '.*\\' + this.config.identifierSuffix + '$'
        );
    }

    _wrapIdentifier(name: string) {
        if (this.builder.options.wrappedIdentifiers) {
             let self = this;
             let nameParts = name.match(this.identifierPartsRegexp);

            return _(nameParts).map(function(namePart) {
                if (namePart !== '*' && !self.wrappedIdentifierPartRegexp.test(namePart)) {
                    namePart = self.config.identifierPrefix + namePart + self.config.identifierSuffix;
                }

                return namePart;
            }).join('.');
        }

        return name;
    }

    buildLogicalOperator(params: any) {
         let self = this;

         let operator = params.operator;
         let value = params.value;

        if (objectUtils.isSimpleValue(value)) {
            value = _.zipObject([params.defaultFetchingOperator], [value]);
        }

        if (_.isEmpty(value)) return '';

         let result;

        if (_.isArray(value)) {
            // if value is array: [{a: 1}, {b: 2}] process each item as logical operator
            result = _(value).map(function(item) {
                return self.buildOperator({
                    context: 'logical',
                    contextOperator: operator,
                    operator: '$and',
                    value: item,
                    states: [],
                    defaultFetchingOperator: params.defaultFetchingOperator
                });
            });
        } else {
            result = _(value).map(function(item, field) {
                // if field name is not a operator convert it to {$field: {name: 'a', $eq: 'b'}}
                if (field[0] !== '$') {
                    if (objectUtils.isSimpleValue(item) || _.isArray(item)) {
                        item = {$eq: item};
                    }
                    item = _.defaults({name: field}, item);
                    field = '$field';
                }

                return self.buildOperator({
                    context: 'logical',
                    contextOperator: operator,
                    operator: field,
                    value: item,
                    states: [],
                    defaultFetchingOperator: params.defaultFetchingOperator
                });
            });
        }

        return this.operators.logical.get(operator).fn(_.compact(result));
    }

    buildComparisonOperator(params: any) {
         let self = this;

         let operator = params.operator;

        _(params.states).each(function(state) {
            operator = self.operators.state.get(state).getOperator(operator);
        });

         let operatorParams = this.operators.comparison.get(operator);

         let value = this.buildEndFetchingOperator({
            context: 'comparison',
            contextOperator: operator,
            value: params.value,
            states: params.states,
            defaultFetchingOperator: operatorParams.defaultFetchingOperator ||
              params.defaultFetchingOperator
        });

        return operatorParams.fn(params.field, value);
    }

    buildFetchingOperator(params: any) {
         let operator = params.operator;
         let value = params.value;

         let field = this.operators.fetching.get(operator).fn(value, params.end);

         let result;
        if (params.end || objectUtils.isSimpleValue(value)) {
            result = field;
        } else {
            result = this.buildOperatorsGroup({
                context: 'fetching',
                contextOperator: operator,
                operator: '$and',
                field: field,
                value: value,
                states: params.states,
                defaultFetchingOperator: params.defaultFetchingOperator
            });
        }

        return result;
    }

    buildEndFetchingOperator(params: any) {
         let self = this;

         let value = params.value;
         let operator;

        if (objectUtils.isObjectObject(value)) {
            // get first query operator
            operator = _(value).findKey(function(item, operator) {
                return operator[0] === '$' && self.operators.fetching.has(operator);
            });

            if (operator) {
                value = value[operator];
            }
        }

        return this.buildOperator(_.extend({}, params, {
            operator: operator || params.defaultFetchingOperator,
            value: value,
            end: true
        }));
    }

    buildStateOperator(params: any) {
        return this.buildOperatorsGroup(_.extend({}, params, {
            context: 'state',
            contextOperator: params.operator,
            operator: '$and',
            states: params.states.concat(params.operator)
        }));
    }

    buildOperatorsGroup(params: any) {
         let self = this;

         let value = params.value;

         let result;
        if (objectUtils.isObjectObject(value)) {
            result = this.operators.logical.get(params.operator).fn(
              _(value)
                .chain()
                .map(function(item, operator) {
                    if (operator[0] !== '$') return '';

                    if (self.operators.fetching.has(operator)) {
                        // convert {a: {$field: 'b'}} to {a: {$eq: {$field: 'b'}}}
                        item = _.zipObject([operator], [item]);
                        operator = '$eq';
                    }

                    return self.buildOperator(_.extend({}, params, {
                        operator: operator,
                        value: item
                    }));
                })
                .compact()
                .value()
            );

            if (!result) result = params.field;
        } else {
            result = this.buildEndFetchingOperator(params);
        }

        return result;
    }

    buildOperator(params: any) {
         let isContextValid = function(expectedContexts, context) {
            return _.includes(expectedContexts, context);
        };

         let context = params.context;
         let operator = params.operator;

         let result;

         let contexts: any = _(this.operators).mapValues(function(operatorsGroup) {
            return operatorsGroup.has(operator);
        });

        if (!_(contexts).some()) {
            throw new Error('Unknown operator "' + operator + '"');
        }

        if (contexts.logical && isContextValid(['null', 'logical'], context)) {
            result = this.buildLogicalOperator(params);
        } else if (contexts.fetching && isContextValid(['logical', 'comparison'], context)) {
            result = this.buildFetchingOperator(params);
        } else if (contexts.comparison && isContextValid(['fetching', 'state'], context)) {
            result = this.buildComparisonOperator(params);
        } else if (contexts.state && isContextValid(['fetching', 'state'], context)) {
            result = this.buildStateOperator(params);
        } else {
             let errMessage = 'Unexpected operator "' + operator + '" at ' +
              (context === 'null' ? 'null ' : '') + 'context';

            if (params.contextOperator) {
                errMessage += ' of operator "' + params.contextOperator + '"';
            }

            throw new Error(errMessage);
        }

        return result;
    }

    buildCondition(params: any) {
        return this.buildOperator({
            context: 'null',
            operator: '$and',
            value: params.value,
            states: [],
            defaultFetchingOperator: params.defaultFetchingOperator
        });
    }

    buildModifier(params: any) {
         let self = this;

        return _(params.modifier)
          .chain()
          .map(function(values, field) {
               let modifier;

              if (field[0] === '$') {
                  modifier = field;
              } else {
                  modifier = '$set';
                  values = _.zipObject([field], [values]);
              }

               let modifierFn = self.modifiers.get(modifier);

              if (!modifierFn) {
                  throw new Error('Unknown modifier "' + modifier + '"');
              }

              return _(values).map(function(value, field) {
                  field = self._wrapIdentifier(field);
                  value = self.buildBlock('term', {term: value, type: 'value'});

                  return modifierFn(field, value);
              });
          })
          .flatten()
          .compact()
          .value()
          .join(', ');
    }

    buildBlock(block, params) {
         let blockFn = this.blocks.get(block);

        if (!blockFn) {
            throw new Error('Unknown block "' + block + '"');
        }

        return blockFn(params);
    }

    buildTemplate(type, params) {
         let self = this;

         let template = this.templates.get(type);
        if (!template) {
            throw new Error('Unknown template type "' + type + '"');
        }

        params = _.defaults({}, params, template.defaults);

        if (template.validate) {
            template.validate(type, params);
        }

        return template.pattern.replace(blockRegExp, function(fullMatch, block, space) {
            if (_.isUndefined(params[block])) {
                return '';
            } else {
                if (self.blocks.has(type + ':' + block)) block = type + ':' + block;
                return self.buildBlock(block, params) + space;
            }
        }).trim();
    }
}
