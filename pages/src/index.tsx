import React from "react";
import ReactDOM from "react-dom";
import scriptjs from "scriptjs";
import * as serviceWorker from "./serviceWorker";
import { CodeGenerator } from "@babel/generator";

declare function parse(code: string): void;

const codes = {
  hello: `\
(begin
  (define msg "Hello World!")
  (define hello (lambda () (alert msg)))
  (hello))
`,
  add1: `\
(begin
  (define add1 (lambda (x) (+ x 1)))
  (alert (add1 10)))
`,
  cons: `(alert (cons 1 (cons 2 3)))`
};
type CodeName = keyof typeof codes;

const App = () => {
  const [loading, setLoading] = React.useState(true);
  const [code, setCode] = React.useState(codes.hello);
  React.useEffect(() => {
    scriptjs("//cdn.rawgit.com/her0e1c1/schemejs/master/main.js", () => {
      setLoading(false); // import `parse` function
    });
  }, []);
  if (loading) return <div />;
  return (
    <div>
      <h1>Schemejs</h1>
      <textarea
        rows={5}
        cols={40}
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      <div>
        <button onClick={() => parse(code)}>RUN</button>
        <select onChange={e => setCode(codes[e.target.value as CodeName])}>
          {Object.keys(codes).map(code => (
            <option value={code}>{code}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
serviceWorker.unregister();
