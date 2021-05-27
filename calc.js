const _calcPre = calcString => {
    let stack = [];
    let level = 0;

    for (let i = 0; i < calcString.length; i++) {
        const el = calcString[i];
        const last = stack[stack.length - 1];

        console.log(el, last);

        if (el === "(") {
            if (level === 0) {
                if (last?.type === "number" || last?.type === "subQuery") {
                    stack.push({
                        content: "*",
                        type: "operation",
                    });

                }

                stack.push({
                    content: el,
                    type: "subQuery",
                });


            } else {
                last.content += el;

            }

            level++;

        } else if (el === ")") {
            level--;
            last.content += el;

        } else if (level !== 0) {
            last.content += el;

        } else if (("0" <= el && el <= "9") || el === ".") {
            if (last?.type === "number") {
                last.content += el;

            } else if (stack.length === 1 && last?.type === "operation") {
                stack[0] = {
                    content: stack[0].content + el,
                    type: "number",
                }

            } else {
                stack.push({
                    content: el,
                    type: "number",
                });

            }

        } else if (el === "+" || el === "-" || el === "*" || el === "/" || el === "%" || el === "^") {
            stack.push({
                content: el,
                type: "operation",
            });

        } else if (el === "x") {
            /* Special case, minus in the beginning */
            if (stack.length === 1 && last?.type === "operation") {
                stack[0] = {
                    content: stack[0].content + "1",
                    type: "number",
                }

                stack.push({
                    content: "*",
                    type: "operation",
                })
            }

            if (last?.type === "number" || last?.type === "subQuery") {
                stack.push({
                    content: "*",
                    type: "operation",
                })
            }

            stack.push({
                content: el,
                type: "unknown",
            })


        } else {
            if (last?.type === "function") {
                last.content += el;

            } else {
                stack.push({
                    content: el,
                    type: "function",
                })

            }

        }

    }

    console.log("beginning:");
    console.log(stack);



    stack.forEach((el, i) => {
        if (el.type === "subQuery") {
            stack[i] = _calcPre(el.content.substring(1, el.content.length - 1));
        }
    })



    console.log("after SubQuerys:");
    stack.forEach(console.log)
    console.log(stack);



    for (let i = 0; i < stack.length; i++) {
        const { content, type } = stack[i];

        type === "function" && preDefFuncs.some(preDefFunc => {
            if (content === preDefFunc[0]) {
                console.log("next:", stack[i + 1]);

                let ins;

                if (stack[i + 1].type === "unknown") {
                    ins = {
                        content: x => preDefFunc[1](x),
                        type: "xDependent",
                    }

                } else if (stack[i + 1].type === "xDependent") {
                    ins = {
                        content: x => preDefFunc[1](x),
                        type: "xDependent",
                    }

                } else {
                    ins = {
                        content: preDefFunc[1](stack[i + 1].content),
                        type: "number",
                    }

                }

                stack.splice(i, 2, ins)
            }
        })
    }



    console.log("after functions:");
    stack.forEach(console.log)
    console.log(stack);




    operations.forEach(operationGroup => operationGroup.forEach(operation => {
        for (let i = 0; i < stack.length; i++) {
            const { content, type } = stack[i];

            if (type === "operation" && content === operation[0]) {
                let ins;

                const first = stack[i - 1].content;
                const second = stack[i + 1].content;

                /* TODO I am sure there is a better/smaller way to write this (besides only looking at the content) */

                if (stack[i - 1].type === "unknown" && stack[i + 1].type === "number") {

                    if (operation[3][second] === true) {
                        ins = stack[i - 1];

                    } else if (operation[3][second] !== undefined) {
                        ins = {
                            content: +operation[3][second],
                            type: "number",
                        }

                    } else {
                        ins = {
                            content: x => operation[1](x, second),
                            type: "xDependent",
                        }

                    }


                } else if (stack[i - 1].type === "number" && stack[i + 1].type === "unknown") {
                    console.log("___number * unknown");

                    if (operation[2][first] === true) {
                        ins = stack[i + 1];

                    } else if (operation[2][first] !== undefined) {
                        ins = {
                            content: +operation[2][first],
                            type: "number",
                        }

                    } else {
                        ins = {
                            content: x => operation[1](first, x),
                            type: "xDependent",
                        }

                    }

                } else if (stack[i - 1].type === "xDependent" && stack[i + 1].type === "number") {

                    if (operation[3][second] === true) {
                        ins = stack[i - 1];

                    } else if (operation[3][second] !== undefined) {
                        ins = {
                            content: +operation[3][second],
                            type: "number",
                        }

                    } else {
                        ins = {
                            content: x => operation[1](first(x), second),
                            type: "xDependent",
                        }

                    }

                } else if (stack[i - 1].type === "number" && stack[i + 1].type === "xDependent") {

                    if (operation[2][first] === true) {
                        ins = stack[i + 1];

                    } else if (operation[2][first] !== undefined) {
                        ins = {
                            content: +operation[2][first],
                            type: "number",
                        }

                    } else {
                        ins = {
                            content: x => operation[1](first, second(x)),
                            type: "xDependent",
                        }

                    }


                } else if (stack[i - 1].type === "xDependent" && stack[i + 1].type === "unknown") {

                    ins = {
                        content: x => operation[1](first(x), x),
                        type: "xDependent",
                    }

                } else if (stack[i - 1].type === "unknown" && stack[i + 1].type === "xDependent") {

                    ins = {
                        content: x => operation[1](x, second(x)),
                        type: "xDependent",
                    }

                } else if (stack[i - 1].type === "xDependent" && stack[i + 1].type === "xDependent") {

                    ins = {
                        content: x => operation[1](first(x), second(x)),
                        type: "xDependent",
                    }

                } else if (stack[i - 1].type === "unknown" && stack[i + 1].type === "unknown") {

                    ins = {
                        content: x => operation[1](x, x),
                        type: "xDependent",
                    }

                } else {

                    ins = {
                        content: operation[1](stack[i - 1].content, stack[i + 1].content),
                        type: "number",
                    }
                }

                stack.splice(i - 1, 3, ins);
                i--;
            }
        }
    }));

    console.log("after operations:");
    stack.forEach(console.log)
    console.log(stack.length, stack);

    return stack[0];
};

const calc = input => {
    input = input.replace(/,/g, ".").replace(/\*\*/g, "^").replace(/ +/g, "").replace(/(?<!\(\d+)e|e(?![+-]\d+\))/g, Math.E).replace(/pi/g, Math.PI)
    const res = _calcPre(input);
    if (res.type === "number") {
        return () => +res.content;

    } else if (res.content === "x") {
        return x => x;

    } else {
        return res.content;

    }
}
