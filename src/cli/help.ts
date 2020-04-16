export const build = [
    "",
    "Fuzzy search:",
    "[names...] can be multiple string arguments matching ", 
    "the `${name} ${region}` of your ami's (case-sensitive). ", 
    "Strings prefixed with '^' (IE: ^Web) will be a negative ", 
    "match (you may need to escape \\^).",
    "",
    "Match rules will be evaluated in the order given for each ",
    "ami name + region. The search is not terribly intelligent ",
    "so it would be best to put your negative matches after your ",
    "positive matches.",
    "",
    "Fuzzy search examples:",
    "Say we have the following ami's queued:",
    "ProdWeb us-west-1, StagingWeb us-west-1, ProdWeb us-east-2, StagingWeb us-east-2,",
    "ProdWeb us-west-2, StagingWeb us-west-2",
    "",
    "The command: `ami-builder build path/to/build.js Web west ^-2`",
    "Would result in:  ProdWeb us-west-1, StagingWeb us-west-1",
    ""
]

