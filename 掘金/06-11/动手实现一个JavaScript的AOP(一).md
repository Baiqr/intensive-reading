# 动手实现一个JavaScript的AOP(一)

> 文章首发于我的个人博客[huangmb.github.io](https://juejin.cn/post/huangmb.github.io)，欢迎关注。

## 前言

AOP即面向切面编程，简单来说就是可以通过编译期或者运行时在不修改源代码的情况下给程序动态增加功能的一种技术。

### AOP应用场景

AOP比较典型的应用有：**日志记录、性能监控、埋点上报、异常处理**等等。对于业务无关的附加功能，直接写到业务代码中也可以实现，但这显然不是一个有"洁癖"程序员的作风；而且这些功能往往需求多变，或者会污染业务代码的实现，掺杂在一起难以维护。无侵入的AOP才是"附加功能"的最佳选择。

### Java的AOP实现

在Java领域，最负盛名的AOP框架莫过于`AspectJ`，不论是客户端的Swing项目(编译期织入)，还是Web平台的Spring项目（运行时动态代理），我们都可以见到它的身影。

### JavaScript版本的AOP实现？

那么在JavaScript上有没有AspectJ这样的框架呢?

笔者目前在开发一个React Native项目，测试妹子要求给她打印页面的一些诸如`请求起止时间`、`数据解析起止时间`、`视图渲染起止时间`之类的性能指标。

面对这样的要求，首先想到的就是通过AOP实现。 毕竟这不是产品经理的**需求**，写到业务也不合适，甚至可能会影响到正式版本的性能； 本地单独写个版本，不合入主仓库，这样的话测试妹子明天又来要个版本，又得在新版本上再写一遍（想想好像也不是不可以）。

回到这个"要求"，Google了一番"JavaScript" + "AOP"关键字，并没有找到一个**合适**的框架┐(ﾟ～ﾟ)┌。

或许并不需要这样一个"框架"呢。庆幸的是，js作为一个语法高度自由的弱类型语言，允许动态增删方法，这不就是各种AOP框架实现的基础么。

于是就有了这篇文章，自己撸一个js版本的AOP实现。

## AOP的理论基础

和尚念经时间。

AOP一般有以下几个概念：

- 连接点(JointPoint):
  **能够被拦截的地方**，一般是成员方法或者属性，它们都可以称之为连接点。
- 切点(PointCut):
  **具体定位的连接点**，既然每个方法(或属性)都可以作为连接点，我们不可能对所有方法都进行增强，那么被我们匹配用来增强的方法就是切点。
- 增强/通知(Advice): 就是我们用来添加到特定切点上的逻辑代码，用于"增强"原有的功能。
- 切面(Aspect):
  切面由`切点`和`增强`组成，就是定义你要在"什么地方"以"何种方式"做"什么事"。

而`增强(Advice)`一般有以下五种类型：

- 前置(before): 也就是在连接点执行前实施增强。
- 异常(after throw) 在连接点抛出异常后实施增强，一般允许拿到连接点抛出的异常。
- 返回(after return) 在连接点正常执行后实施增强，一般允许拿到连接点的返回值。
- 后置(after (final)): 在连接点执行后实施增强，不论连接点是正常返回还是抛出异常，一般拿不到返回值，因为不知道是异常还是返回。
- 环绕(around) 在连接点执行前后实施增强，甚至可以让连接点可选的执行。

## 动手实现

撸起袖子开始干。

### 实现切点和切面

我们知道，JavaScript的对象都有个prototype原型对象，即使是es6的class上定义的属性和方法，其实也是在声明在prototype上。

我们可以通过`SomeClass.prototype.methodName`找到SomeClass类的MethodName方法，这样，一个最简单的方法名匹配切点就实现了。

我们可以通过修改prototype,重新定义方法，比如:

```
let target = SomeClass;
let pointCut = 'methodName';
// 切点
let old = target.prototype[pointCut]
// 切面
target.prototype[pointCut] = function () {
    // 前置增强
    console.log(`method ${pointCut} will be invoke`);
    old();
}
复制代码
```

这里为SomeClass类重新定义了methodName方法，在原方法之前加入了一条log语句，这条语句其实就是`before`类型的增强代码。这段代码就是最简单的前置增强的切面例子。

### 实现增强/通知

在实现具体的增强前，先定义一个匹配切点的方法，目前最简单的版本就是根据方法名直接匹配。

```
let findPointCut = (target, pointCut) => {
    if (typeof pointCut === 'string') {
        let func = target.prototype[pointCut];
        // 暂不支持属性的aop
        if (typeof func === 'function') {
            return func;
        }
    }
    // 暂不支持模糊匹配切点
    return null;
};
复制代码
```

最终，我们将以下面的结构来提供我们的AOP工具，其中`target`即为要增强的类，`pointCut`为要增强的方法名，`cb`为回调即我们要注入的增强代码。

```
let aop = {
    before(target, pointCut, cb) {
    },
    after(target, pointCut, cb) {
    },
    afterReturn(target, pointCut, cb) {
    },
    afterThrow(target, pointCut, cb) {
    },
    around(target, pointCut, cb) {
    }

};
export default aop;
复制代码
```

以前置增强为例，我们要给增强代码传递的连接点信息只要最基础的目标类、目标方法、原始参数，便于增强代码识别切面信息。

> 在连接点信息中还加入了self即当前对象的引用，之所以加入这个信息，是因为当增强代码是一个**箭头函数**时，后面的`apply`和`call`方法无法修改增强代码的this引用，可以通过这个self来访问目标对象的属性； **使用function定义的回调可以直接使用this访问目标对象**。

```
before(target, pointCut, cb = emptyFunc) {

        let old = findPointCut(target, pointCut);
        if (old) {
            target.prototype[pointCut] = function () {
                let self = this;
                let joinPoint = {
                    target,
                    method: old,
                    args: arguments,
                    self
                };
                cb.apply(self, joinPoint);
                return old.apply(self, arguments);
            };
        }
    }
复制代码
```

因为后面几种增强跟这个差不太多，可能会出现很多重复代码。现在将所有的增强进行了一个封装，所有类型的增强都融合在advice方法里。整个aop完整代码如下：

```
let emptyFunc = () => {
};

let findPointCut = (target, pointCut) => {
    if (typeof pointCut === 'string') {
        let func = target.prototype[pointCut];
        // 暂不支持属性的aop
        if (typeof func === 'function') {
            return func;
        }
    }
    // 暂不支持模糊匹配切点
    return null;
};
let advice = (target, pointCut, advice = {}) => {
    let old = findPointCut(target, pointCut);
    if (old) {
        target.prototype[pointCut] = function () {
            let self = this;
            let args = arguments;
            let joinPoint = {
                target,
                method: old,
                args,
                self
            };
            let {before, round, after, afterReturn, afterThrow} = advice;
            // 前置增强
            before && before.apply(self, joinPoint);
            // 环绕增强
            let roundJoinPoint = joinPoint;
            if (round) {
                roundJoinPoint = Object.assign(joinPoint, {
                    handle: () => {
                        return old.apply(self, arguments || args);
                    }
                });
            } else {
                // 没有声明round增强,直接执行原方法
                round = () => {
                    old.apply(self, args);
                };
            }


            if (after || afterReturn || afterThrow) {
                let result = null;
                let error = null;
                try {
                    result = round.apply(self, roundJoinPoint);
                    // 返回增强
                    return afterReturn && afterReturn.call(self, joinPoint, result) || result;
                } catch (e) {
                    error = e;
                    // 异常增强
                    let shouldIntercept = afterThrow && afterThrow.call(self, joinPoint, e);
                    if (!shouldIntercept) {
                        throw e;
                    }
                } finally {
                    // 后置增强
                    after && after.call(self, joinPoint, result, error);
                }
            } else {
                // 未定义任何后置增强,直接执行原方法
                return round.call(self, roundJoinPoint);
            }
        };
    }
};

let aop = {
    before(target, pointCut, before = emptyFunc) {
        advice(target, pointCut, {before});
    },
    after(target, pointCut, after = emptyFunc) {
        advice(target, pointCut, {after});
    },
    afterReturn(target, pointCut, afterReturn = emptyFunc) {
        advice(target, pointCut, {afterReturn});
    },
    afterThrow(target, pointCut, afterThrow = emptyFunc) {
        advice(target, pointCut, {afterThrow});
    },
    round(target, pointCut, round = emptyFunc) {
        advice(target, pointCut, {round});
    }
};

export default aop;
复制代码
```

现在我们的before可以简化成：

```
 before(target, pointCut, before = emptyFunc) {
    advice(target, pointCut, {before});
 }
复制代码
```

## 使用方法

### 前置before

前置增强不干扰原方法的执行，只有一个参数为连接点信息，可以访问到切点所在的类和方法以及当前的参数和this引用。

```
import Test from './test';
aop.before(Test, 'test', (joinPoint) => {
    let {target, method, args, self} = joinPoint;
    console.log('test方法将被执行');
});
复制代码
```

### 后置after

后置增强在原方法执行完毕后执行，参数除了连接点信息外还有返回结果和异常。因为原方法可能是正常返回也可能抛出异常，所以result和error有一个为空(AspectJ无此设计)。

```
import Test from './test';
aop.after(Test, 'test', (joinPoint, result, error) => {
    let {target, method, args, self} = joinPoint;
    console.log('test方法执行完毕');
});
复制代码
```

### 返回afterReturn

返回增强可以拿到原方法的返回值，即回调的第二个参数。 如果需要修改返回值，可以在增强里面return，否则使用原返回值。

```
import Test from './test';
aop.afterReturn(Test, 'test', (joinPoint, result) => {
    let {target, method, args, self} = joinPoint;
    console.log('test方法正常执行完毕');
    // 可以修改返回值
    return newResult;
});
复制代码
```

### 异常afterThrow

异常增强在原方法发生异常时执行，回调的第二个参数为异常。

并且回调可以方法布尔值，表示是否截断异常，当return true时异常不会继续上抛(AspectJ无此功能)。

```
import Test from './test';
aop.afterThrow(Test, 'test', (joinPoint, error) => {
    let {target, method, args, self} = joinPoint;
    console.log('test方法抛出异常');
});
复制代码
```

### 环绕around

环绕增强是最灵活的方法，将原方法的执行权交给增强代码来调用，在连接点中多了一个handle方法，增强代码中手动调用handle方法，因此可以根据调用时机实现前面四种增强类型，并且可以定制原方法的参数和返回值。 **arround增强需要return结果给原方法的调用方**

```
import Test from './test';
aop.around(Test, 'test', (joinPoint, error) => {
    let {target, method, args, self, handle} = joinPoint;
    console.log('test方法即将执行');
    let result = handle(); // 无参调用即使用原始参数调用原方法
    // let result = handle(args) // 使用指定的参数调用原方法
    // 可以对result进行处理
    console.log('test方法执行完毕');
    // 必须返回一个结果
    return result;
});
复制代码
```

## 结尾

得益于JavaScript语言的动态性，实现一个基础版功能过得去的AOP还是非常容易的，基本可以满足一般NodeJs、React Native等项目使用。

当然还有很多不足的地方，比如更灵活的切面等，如果大家用过AspectJ，可能会知道Aspect可以通过全程类名、特定注解、继承关系、模糊匹配等多种方式声明切点，无疑能使aop的使用更加灵活。另外也可以针对React的Component组件类aop做改进，这部分可以参考react-proxy实现。

后面可能会视应用场景逐渐优化和改进aop。