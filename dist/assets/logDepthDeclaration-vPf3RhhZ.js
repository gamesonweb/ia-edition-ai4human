import{t as e}from"./shaderStore-C5EQilFW.js";var t=`meshUboDeclaration`,n=`#ifdef WEBGL2
uniform mat4 world;uniform float visibility;
#else
layout(std140,column_major) uniform;uniform Mesh
{mat4 world;float visibility;};
#endif
#define WORLD_UBO
`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=n);var r=`mainUVVaryingDeclaration`,i=`#ifdef MAINUV{X}
varying vec2 vMainUV{X};
#endif
`;e.IncludesShadersStore[r]||(e.IncludesShadersStore[r]=i);var a=`logDepthDeclaration`,o=`#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;varying float vFragmentDepth;
#endif
`;e.IncludesShadersStore[a]||(e.IncludesShadersStore[a]=o);