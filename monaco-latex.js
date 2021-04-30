let editor
require.config({ paths: { "vs": "node_modules/monaco-editor/min/vs" } })
require(["vs/editor/editor.main"], () => {
    const edit = document.getElementById("editor")
    const opt = {
        value: [
            ""
        ].join("\n"),
        language: "latex",
        theme: "latex",
        automaticLayout: true
    }
    monaco.languages.register({ id: "latex" })
    monaco.languages.setMonarchTokensProvider('latex', {
        keywords: [
            "document", 
            "section", "subsection", "subsubsection",
            "screen", "itembox",
            "eqnarray", "eqnarray*",
        ],
        cles: [
            "jsarticle", "jarticle", "article",
            "jsbook", "jbook", "book",
            "jsreport", "jreport", "report"
        ],
        tokenizer: {
            root: [
                [/[a-z_$][\w$]*\*?/, {
                    cases: {
                        "@cles": "cls",
                        '@keywords': 'keyword',
                        '@default': 'identifier'
                    }
                }],
                [/%.*$/, "comment"],
                [/\\\w*/, "be"],
                [/\d+/, "number"]
            ]
        }
    })

    // Define a new theme that contains only rules that match this language
    monaco.editor.defineTheme('latex', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: "be", foreground: "E91E63" },
            { token: "cls", foreground: "9E9E9E", fontStyle: "italic" },
            { token: "bracket", foreground: "212121" },
            { token: "keyword", foreground: "2196F3" },
            { token: "text", foreground: "212121" },
            { token: "comment", foreground: "4CAF50" },
            { token: "number", foreground: "FF9800" }
        ]
    })
    editor = monaco.editor.create(edit, opt)
})