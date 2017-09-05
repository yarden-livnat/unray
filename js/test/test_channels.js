"use strict";

import {assert, expect, should} from 'chai';

import { create_three_data } from "../src/channels";

describe('channels', function() {
    describe('#create_three_data()', function() {
        const method = "surface";
        const encoding = {
            cells: { field: "c123" },
            points: { field: "p234" }
        };
        const data = {
            c123: new Int32Array([0,1,2,3]),
            p234: new Float32Array([0,0,0, 0,0,1, 0,1,0, 1,0,0])
        };
        it('should create stuff', function() {
            const { uniforms, defines, attributes } = create_three_data(method, encoding, data);
            expect(uniforms.u_cell_texture_shape.value).deep.eq([1, 1]);
        });
    });
});
