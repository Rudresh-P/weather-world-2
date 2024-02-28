uniform vec3 uSunDirection;
uniform vec3 uAtmosphericDayColor;
uniform vec3 uAtmosphericTwilightColor;

varying vec3 vNormal;
varying vec3 vPosition;


void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.);

    // Sun Orientation
    float sunOrientation = dot(uSunDirection, normal);

    //Atmosphere
    float atmosphereDayMix = smoothstep( -0.5, 1., sunOrientation);
    vec3 atmosphereColor = mix( uAtmosphericTwilightColor , uAtmosphericDayColor, atmosphereDayMix);

    color += atmosphereColor;

    // ALPHA
    float edgeAlpha = dot(viewDirection,normal);
    edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha);

    float dayAlpha = smoothstep( -0.5, 0. ,  sunOrientation);

    float aplha = edgeAlpha * dayAlpha;


    // Final color
    gl_FragColor = vec4(color, aplha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}