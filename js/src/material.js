"use strict";

import _ from "underscore";
import * as THREE from "three";

// Load shaders. The shaders contain lots of #ifdefs,
// so the final shader program depends on the defines
// built for a specific plot configuration.
const vertexShader = require("./glsl/vertex.glsl");
const fragmentShader = require("./glsl/fragment.glsl");

// Note:
// Cells are oriented such that the front side should be
// visible, which means we either use FrontSide or DoubleSide.

// Note:
// src is the value written by the fragment shader
// dst is the value already in the framebuffer
// Otherwise see opengl docs for meaning of blendSrc, etc.

// Note:
// Methods below configure blend equations and note how they
// relate to the fragment shader variables C and a, i.e.:
// dst = a * dst + 1 * C
// means the result of a blend operation is to scale
// the existing dst value by a from the fragment shader
// then add C from the fragment shader.

// Note:
// Depth testing is turned on to allow composing with
// previously drawn opaque objects.

const default_nontransparent = {
    side: THREE.FrontSide,
    //side: THREE.DoubleSide,
    transparent: false,
    depthTest: true,
    depthWrite: true,
};

const default_transparent = {
    side: THREE.FrontSide,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
};

const default_minmax = Object.assign(default_transparent, {
    // dst = min|max(1 * dst, 1 * C)
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
});

const method_configs = {
    surface: default_nontransparent,
    isosurface: default_nontransparent,
    max: Object.assign(default_minmax, {
        // dst = max(dst, C)
        // Rendering front and back sides means shaders can be
        // simpler at the cost of doubling the number of triangles.
        side: THREE.DoubleSide,
        blendEquation: THREE.MaxEquation,
    }),
    // TODO: Profile and pick one version
    max2: Object.assign(default_minmax, {
        // dst = max(dst, C)
        // Rendering front side only and computing back
        // side value in shader, meaning more costly shader
        // computations but half as many triangles.
        side: THREE.FrontSide,
        blendEquation: THREE.MaxEquation,
    }),
    min: Object.assign(default_minmax, {
        // dst = min(dst, C)
        // Rendering front and back sides means shaders can be
        // simpler at the cost of doubling the number of triangles.
        side: THREE.DoubleSide,
        blendEquation: THREE.MinEquation,
    }),
    min2: Object.assign(default_minmax, {
        // dst = min(dst, C)
        // Rendering front side only and computing back
        // side value in shader, meaning more costly shader
        // computations but half as many triangles.
        side: THREE.FrontSide,
        blendEquation: THREE.MinEquation,
    }),
    xray: Object.assign(default_transparent, {
        // dst = (1 - a) * dst + 1 * C = (1 - a)*dst
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
    }),
    // TODO: Remove and keep the best one
    xray2: Object.assign(default_transparent, {
        // dst = (1 - a) * dst + 1 * C = (1 - a)*dst
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
    }),
    alt_xray: Object.assign(default_transparent, {
        // dst = src .* dst + 0 * src
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
    }),
    sum: Object.assign(default_transparent, {
        // dst = 1 * dst + 1 * C
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
    }),
    volume: Object.assign(default_transparent, {
        // dst = (1 - a) * dst + 1 * C
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
    }),
};

export
function create_material(method, uniforms, defines) {
    const fog = false;  // To enable fog, would need custom shader support
    const material_config = {
        uniforms, defines,
        vertexShader, fragmentShader,
        fog
    };
    Object.assign(material_config, method_configs[method]);

    // Configure shader
    // (using only a few things from ShaderMaterial, could also
    // use RawShaderMaterial by adding those few things explicitly)
    const material = new THREE.ShaderMaterial(material_config);

    // Some extensions need to be explicitly enabled
    material.extensions.derivatives = true;

    return material;
}
