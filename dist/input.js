var Controls;
(function (Controls) {
    Controls[Controls["FORWARD"] = 0] = "FORWARD";
    Controls[Controls["BACK"] = 1] = "BACK";
    Controls[Controls["LEFT"] = 2] = "LEFT";
    Controls[Controls["RIGHT"] = 3] = "RIGHT";
})(Controls || (Controls = {}));
const keyboardMap = {
    ArrowDown: Controls.BACK,
    ArrowUp: Controls.FORWARD,
    ArrowLeft: Controls.LEFT,
    ArrowRight: Controls.RIGHT,
};
const controlMap = Object.keys(keyboardMap).reduce((acc, key) => {
    if (keyboardMap[key] in acc) {
        acc[keyboardMap[key]].push(key);
    }
    else {
        acc[keyboardMap[key]] = [key];
    }
    return acc;
}, {});
const currentlyPressedKeys = {};
window.addEventListener('keydown', ev => {
    if (ev.key in keyboardMap) {
        currentlyPressedKeys[ev.key] = true;
    }
});
window.addEventListener('keyup', ev => {
    if (ev.key in keyboardMap) {
        currentlyPressedKeys[ev.key] = false;
    }
});
function isControlPressed(control) {
    return !!controlMap[control].find(keyName => currentlyPressedKeys[keyName]);
}
export { Controls, isControlPressed };
