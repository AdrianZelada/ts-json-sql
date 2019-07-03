import {intersection}from 'lodash-es';

export const TemplateChecks = {
    requiredProp: (type, params, propName) => {
        if (params[propName]) {
            throw new Error('`' + propName + '` property is not set in `' + type + '` clause');
        }
    },

    atLeastOneOfProps: (type: any, params: any, expectedPropNames: any) => {
        const keys = Object.keys(params) || [];
        var propNames = intersection(keys, expectedPropNames).value();

        if (!propNames.length) {
            throw new Error('Neither `' + expectedPropNames.join('`, `') +
                '` properties are not set in `' + type + '` clause');
        }
    },

    onlyOneOfProps: (type, params, expectedPropNames) => {
    },

    propType: (type, params, propName, expectedTypes) => {
    },

    minPropLength: (type, params, propName, length) => {
    },

    propMatch: (type, params, propName, regExp) => {
    },

    customProp: (type, params, propName, fn) => {
    }
}
