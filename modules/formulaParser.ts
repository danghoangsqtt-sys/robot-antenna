
/**
 * Converts JavaScript Math expressions to human-readable math format.
 * Example: Math.sin(theta) -> sin(θ)
 */
export const prettifyFormula = (jsFormula: string): string => {
    if (!jsFormula) return "";

    let pretty = jsFormula;

    // Replace Math functions
    pretty = pretty.replace(/Math\.sin/g, "sin");
    pretty = pretty.replace(/Math\.cos/g, "cos");
    pretty = pretty.replace(/Math\.tan/g, "tan");
    pretty = pretty.replace(/Math\.abs/g, "abs");
    pretty = pretty.replace(/Math\.pow\(([^,]+),\s*([^)]+)\)/g, "($1)^$2");
    pretty = pretty.replace(/Math\.exp/g, "exp");
    pretty = pretty.replace(/Math\.sqrt/g, "√");
    pretty = pretty.replace(/Math\.PI/g, "π");
    pretty = pretty.replace(/Math\.log10/g, "log10");
    pretty = pretty.replace(/Math\.log/g, "ln");
    pretty = pretty.replace(/\*\*/g, "^");

    // Replace variables
    pretty = pretty.replace(/theta/g, "θ");
    pretty = pretty.replace(/phi/g, "φ");

    // Clean up multiplication *
    pretty = pretty.replace(/\s*\*\s*/g, "·");

    return pretty;
};

/**
 * Parses user input (Plain Math/Latex-like) to JavaScript
 * Example: sin(theta)^2 -> Math.sin(theta)**2
 */
export const parseInputToJS = (input: string): string => {
    let js = input;
    
    // 0. Remove existing Math. prefix to standardize if user mixed them
    js = js.replace(/Math\./g, "");

    // 1. Constants and Vars
    js = js.replace(/π|pi/gi, "Math.PI");
    js = js.replace(/θ/g, "theta");
    js = js.replace(/φ/g, "phi");

    // 2. Operators
    js = js.replace(/\^/g, "**");

    // 3. Functions - Wrap with Math.
    const funcs = ["sin", "cos", "tan", "abs", "sqrt", "exp", "log", "pow", "min", "max", "acos", "asin", "atan"];
    funcs.forEach(fn => {
        const regex = new RegExp(`\\b${fn}\\b`, "g");
        js = js.replace(regex, `Math.${fn}`);
    });

    return js;
};

export const validateFormula = (js: string): { valid: boolean; error?: string } => {
    try {
        // Smoke test with safe values
        const f = new Function('theta', 'phi', `return ${js};`);
        const val = f(0.5, 0.5);
        if (typeof val !== 'number' || isNaN(val)) {
            return { valid: false, error: "Kết quả không phải là số thực" };
        }
        return { valid: true };
    } catch(e: any) {
        return { valid: false, error: e.message };
    }
};
