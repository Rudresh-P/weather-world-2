uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphericDayColor;
uniform vec3 uAtmosphericTwilightColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;


void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.);

    // Sun Orientation
    float sunOrientation = dot(uSunDirection, normal);
    // color = vec3(sunOrientation);

    //Textures
    float dayMix = smoothstep( -0.25, 0.5, sunOrientation);
    vec3 dayColor = texture(uDayTexture,vUv).rgb;
    vec3 nightColor = texture(uNightTexture,vUv).rgb;
    color =  mix(nightColor,dayColor,dayMix);

    //Specular Cloud Color
    vec2 specularCloudColor = texture(uSpecularCloudTexture,vUv).rg;


    //Clouds
    float cloudMix = smoothstep(0.5, 1., specularCloudColor.g );
    cloudMix *= dayMix;
    color = mix( color, vec3(1.), cloudMix);

    // Fresnel
    float fresnel = dot(viewDirection,normal) + 1.;
    fresnel = pow(fresnel,2.5);

    //Atmosphere
    float atmosphereDayMix = smoothstep( -0.5, 1., sunOrientation);
    vec3 atmosphereColor = mix( uAtmosphericTwilightColor , uAtmosphericDayColor, atmosphereDayMix);

    color = mix(color, atmosphereColor, fresnel * atmosphereDayMix) ;

    // Specular 
    vec3 reflextion = reflect(- uSunDirection, normal);
    float specular = -dot(reflextion,viewDirection);
    specular = max(specular,0.);
    specular = pow(specular, 32.);
    specular *= specularCloudColor.r;

    vec3 specularColor = mix( vec3(1.), atmosphereColor , fresnel );

    color += specular * specularColor;

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}