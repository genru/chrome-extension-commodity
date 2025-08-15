module.exports = {
    "roots": [
        "src"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.test.json" }]
    },
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"]
}; 
