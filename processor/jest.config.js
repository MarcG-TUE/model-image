module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    // Added following the suggestion to fix jest issue with d3 on:
    // https://stackoverflow.com/questions/69226759/jest-unexpected-token-export-when-using-d3
    '^d3$': '<rootDir>/node_modules/model-image/node_modules/d3/dist/d3.min.js',
  },
};


