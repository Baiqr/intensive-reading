// 深度遍历
let arr = [1, [2, [3, 4]]];
let flatten = (arr) => {
    var result = [];
    for (var i = 0, len = arr.length; i < len; i++) {
        if (Object.prototype.toString.call(arr[i]) === '[object Array]') {
            result = result.concat(flatten(arr[i]))
        } else {
            result.push(arr[i])
        }
    }
    return result;
}
console.log(flatten(arr))

// reduce方法

var arr = [1, [2, [3, 4]]];

function flatten(arr) {
    return arr.reduce(function (prev, next) {
        console.log(prev, next) return prev.concat(Array.isArray(next) ? flatten(next) : next)
    }, [])
}
console.log(flatten(arr))

// toString方法
var arr = [1, [2, [3, 4]]];

function flatten(arr) {
    return arr.toString().split(',').map(function (item) {
        return +item
    })
}
console.log(flatten(arr))

// 纯数字的数组
var arr = [1, [2, [3, 4]]];

function flatten(arr) {
    // 数组里面的 toString 方法是被改写过的，如果发现当前元素是一个数组，就会再次调用 toString 方法
    return arr.toString().split(',').map(function (item) {
        return +item
    })
}
console.log(flatten(arr))

// 正则表达式（不包含undefined和null）
let arr = [1, [2, 3.3, ['a,b,c,d,e']]];
let flatten = (arr) => {
    console.log(JSON.stringify(arr).replace(/\[|\]/g, ''));
    return JSON.parse(`[${JSON.stringify(arr).replace(/\[|\]/g, '')}]`);
}
console.log(flatten(arr))

// ES6 拓展运算符
// 工具函数使用的就是这种方式
let arr = [1, [2, 3.3, ['a,b,c,d,e',undefined,null]]];
//console.log([].concat(...arr)); // 浅拷贝，只拷贝一层
function flatten(arr) {
 while (arr.some(item => Object.prototype.toString.call(item)==='[object Array]')) {
        arr = [].concat(...arr);
    }
    return arr;
}

console.log(flatten(arr))

//_.flatMapDeep([1, [2, 3.3, ['a,b,c,d,e',undefined,null]]]); //lodash实际也是采用这种方法