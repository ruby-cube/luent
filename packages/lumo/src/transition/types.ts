export type CSSColor =
    | `#${string}`
    | `rgb(${number}, ${number}, ${number})`
    | `rgba(${number}, ${number}, ${number}, ${number | number})`
    | `hsl(${number}, ${number}%, ${number}%)`
    | `hsla(${number}, ${number}%, ${number}%, ${number | number})`
    | 'transparent'
    | CSSNamedColor;

export type CSSNamedColor =
    | "aliceblue"
    | "antiquewhite"
    | "aqua"
    | "aquamarine"
    | "azure"
    | "beige"
    | "bisque"
    | "black"
    | "blanchedalmond"
    | "blue"
    | "blueviolet"
    | "brown"
    | "burlywood"
    | "cadetblue"
    | "chartreuse"
    | "chocolate"
    | "coral"
    | "cornflowerblue"
    | "cornsilk"
    | "crimson"
    | "cyan"
    | "darkblue"
    | "darkcyan"
    | "darkgoldenrod"
    | "darkgray"
    | "darkgreen"
    | "darkgrey"
    | "darkkhaki"
    | "darkmagenta"
    | "darkolivegreen"
    | "darkorange"
    | "darkorchid"
    | "darkred"
    | "darksalmon"
    | "darkseagreen"
    | "darkslateblue"
    | "darkslategray"
    | "darkslategrey"
    | "darkturquoise"
    | "darkviolet"
    | "deeppink"
    | "deepskyblue"
    | "dimgray"
    | "dimgrey"
    | "dodgerblue"
    | "firebrick"
    | "floralwhite"
    | "forestgreen"
    | "fuchsia"
    | "gainsboro"
    | "ghostwhite"
    | "gold"
    | "goldenrod"
    | "gray"
    | "green"
    | "greenyellow"
    | "grey"
    | "honeydew"
    | "hotpink"
    | "indianred"
    | "indigo"
    | "ivory"
    | "khaki"
    | "lavender"
    | "lavenderblush"
    | "lawngreen"
    | "lemonchiffon"
    | "lightblue"
    | "lightcoral"
    | "lightcyan"
    | "lightgoldenrodyellow"
    | "lightgray"
    | "lightgreen"
    | "lightgrey"
    | "lightpink"
    | "lightsalmon"
    | "lightseagreen"
    | "lightskyblue"
    | "lightslategray"
    | "lightslategrey"
    | "lightsteelblue"
    | "lightyellow"
    | "lime"
    | "limegreen"
    | "linen"
    | "magenta"
    | "maroon"
    | "mediumaquamarine"
    | "mediumblue"
    | "mediumorchid"
    | "mediumpurple"
    | "mediumseagreen"
    | "mediumslateblue"
    | "mediumspringgreen"
    | "mediumturquoise"
    | "mediumvioletred"
    | "midnightblue"
    | "mintcream"
    | "mistyrose"
    | "moccasin"
    | "navajowhite"
    | "navy"
    | "oldlace"
    | "olive"
    | "olivedrab"
    | "orange"
    | "orangered"
    | "orchid"
    | "palegoldenrod"
    | "palegreen"
    | "paleturquoise"
    | "palevioletred"
    | "papayawhip"
    | "peachpuff"
    | "peru"
    | "pink"
    | "plum"
    | "powderblue"
    | "purple"
    | "red"
    | "rosybrown"
    | "royalblue"
    | "saddlebrown"
    | "salmon"
    | "sandybrown"
    | "seagreen"
    | "seashell"
    | "sienna"
    | "silver"
    | "skyblue"
    | "slateblue"
    | "slategray"
    | "slategrey"
    | "snow"
    | "springgreen"
    | "steelblue"
    | "tan"
    | "teal"
    | "thistle"
    | "tomato"
    | "turquoise"
    | "violet"
    | "wheat"
    | "white"
    | "whitesmoke"
    | "yellow"
    | "yellowgreen";


export type CSSLength =
    | `${number}px`
    | `${number}em`
    | `${number}rem`
    | `${number}%`
    | `${number}vh`
    | `${number}vw`
    | `${number}vmin`
    | `${number}vmax`
    | `${number}cm`
    | `${number}mm`
    | `${number}in`
    | `${number}pt`
    | `${number}pc`
    | "auto"
    | "inherit"
    | "initial"
    | "unset";

export type CSSTransitionProperties = {
    opacity?: number;
    transform?: string;

    color?: CSSColor;
    backgroundColor?: CSSColor;

    borderColor?: CSSColor;
    borderWidth?: CSSLength;
    borderRadius?: CSSLength;

    fontSize?: CSSLength;
    fontWeight?: number | "normal" | "bold" | "bolder" | "lighter";
    letterSpacing?: CSSLength;
    wordSpacing?: CSSLength;
    lineHeight?: CSSLength;

    height?: CSSLength;
    width?: CSSLength;
    zIndex?: number;
    maxHeight?: CSSLength;
    maxWidth?: CSSLength;
    minHeight?: CSSLength;
    minWidth?: CSSLength;
    
    marginRight?: CSSLength;
    marginLeft?: CSSLength;
    marginTop?: CSSLength;
    marginBottom?: CSSLength;
    
    paddingRight?: CSSLength;
    paddingLeft?: CSSLength;
    paddingTop?: CSSLength;
    paddingBottom?: CSSLength;
    
    outlineColor?: CSSColor;
    outlineWidth?: CSSLength;
    
    perspective?: CSSLength;
    perspectiveOrigin?: string;

    // TODO: COMPLEX PROPERTIES, need special treatment
    // boxShadow?: string;
    // clipPath?: string;
    // filter?: string;
    // textShadow?: string;
};
