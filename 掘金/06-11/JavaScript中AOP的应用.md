# JavaScript中AOP的应用

### 1. 简介

AOP (Aspect Oriented Programming) ，意为：面向切面编程，通过预编译方式和运行期动态代理实现程序功能的统一维护的一种技术。AOP是OOP的延续，是函数式编程的一种衍生，利用AOP可以对业务逻辑的各个部分进行隔离，从而使得业务逻辑各部分之间的耦合度降低，提高程序的可重用性，同时提高了开发的效率。



![image-20190505163919966](https://user-gold-cdn.xitu.io/2019/5/5/16a87f40b544e7e5?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)



### 2. 基础实现

使用过java spring的同学一定知道，其内分为三种通知，`before`（前置通知）、`after`（后置通知）、`around`（环绕通知）。

下面我们分别在js调用方法时实现这三种通知：

#### before（前置通知）

顾名思义，就是在函数调用前执行

```
Function.prototype.before = function (beforefun) {
  var _orgin = this;    // 保存原函数引用
  return function () { // 返回包含了原函数和新函数的"代理函数"
    beforefun.apply(this, arguments); // 执行新函数，修正this
    return _orgin.apply(this, arguments); // 执行原函数
  }
};

var originFun = function(val){
  console.log('原型函数: '+val);
}

var newFun = originFun.before(function(){
  // 传入函数调用前处理方法
  console.log('before: ' + new Date().getTime())
})

newFun("测试前置通知");

// 调用结果
// before: 1557047939699
// 原型函数: 测试前置通知
复制代码
```

#### after（后置通知）

与before正相反，在函数调用后执行

```
Function.prototype.after = function (afterfun) {
  var _orgin = this;    // 保存原函数引用
  return function () { // 返回包含了原函数和新函数的"代理函数"
    var ret = _orgin.apply(this, arguments); // 执行原函数
    afterfun.apply(this, arguments); // 执行新函数，修正this
    return ret;
  }
};

var originFun = function(val){
  console.log('原型函数: '+val);
}

var newFun = originFun.after(function(){
  // 传入函数调用前处理方法
  console.log('after: ' + new Date().getTime())
})

newFun("测试后置通知");

// 调用结果
// 原型函数: 测试前置通知
// after: 1557047997647
复制代码
```

#### around（环绕通知）

在方法执行前后分别执行

```
// 利用前面的before、after方法实现
Function.prototype.around = function(beforeFun, afterFun) {
	var _orgin = this;
	return function() {
		return _orgin.before(beforeFun).after(afterFun).apply(this, arguments);
	}
}
复制代码
```

### 3. AOP遇到修饰器

JS在ES7的提案中终于增加了修饰器（Decorator）函数，它是用来修改类的行为，但是现在浏览器都不支持，需要使用Babel进行转换，当AOP与修饰器结合后，又会给我们带来什么呢？

#### 日志记录

通过AOP与修饰器的结合会很方便的进行日志的记录或者函数执行时间的记录

```
class Person {
  @log
  say(nick) {
    return `hi ${nick}`;
  }
}

function log(target, name, decriptor){
  var _origin = descriptor.value;
  descriptor.value = function(){
    console.log(`Calling ${name} with `, argumants);
    return _origin.apply(null, arguments);
  };

  return descriptor;
}

var person = new Person();
person.say('小明');
复制代码
```

#### 判断用户登录状态

```
class User {
  @checkLogin
  getUserInfo() {
    console.log('获取用户信息')
  }
}

// 检查用户是否登录
function checkLogin(target, name, descriptor) {
  let method = descriptor.value
  descriptor.value = function (...args) {
    // 校验方法，假设这里可以获取到用户名/密码
    if (validate(args)) {
      method.apply(this, args)
    } else {
      console.log('没有登录，即将跳转到登录页面...')
    }
  }
}

let user = new User()
user.getUserInfo()
复制代码
```

### 4. React中的AOP

在react中使用AOP思想的典型就是高阶组件(HOC)，请看下面的例子

```
function HOCComp(WrappedComponent){
  return class HOC extends Component {
    render(){
      const newProps = {param: 'HOC'};
      return <div>
        <WrappedComponent {...this.props} {...newProps}/>
      </div>
    }
  }
}

@HOCComp
class OriginComponent extends Component {
  render(){
    return <div>这是原始组件{this.props.param}</div>
  }
}
复制代码
```

上面例子中在HOCComp中定义新的props，并传入子组件中。我们也可以对OriginComponent组件中的一些props进行加工，或对OriginComponent外层进行再次包装。从而不必去修改内部组件，保持了功能上的解耦。

### 5. 总结

AOP思想在框架及项目中使用的很多，包括React高阶组件、日志记录、登录验证、redux中间件等。在开发中应该与OOP相辅相成，共同提高软件的健壮性及可维护性。

参考资料

[segmentfault.com/a/119000001…](https://segmentfault.com/a/1190000011479378)

[blog.csdn.net/qq_21460229…](https://blog.csdn.net/qq_21460229/article/details/79696159)