Vue权限路由[菜单权限/按钮权限控制]


前言
   年前完工了做了半年的铁路后台管理系统，系统整体业务比较复杂，这也是我到公司从 0 到 1 的 一个完整系统实践，做这个系统过程中踩了不少坑，也学到了很多。

  做完这个系统没多久，紧接着又一个系统来了，没及时总结，惭愧哈！其实我们在做的后台管理系统大多数基础框架都一样，后台管理系统 主要的 是 角色权限管理 ， 按钮权限管理 和 菜单管理 ， 其它的业务主要围绕在这个基础之上进行扩展，最终 构成了 符合业务的后台管理系统.

 由于我司的项目都是采用 Vue 技术栈，那么该文章也是讲解 Vue 如何进行权限管理 进行讲解。

结尾有彩蛋哦！
权限授权登录
任何一个后台管理系统都是 首先从登录开始，登录后返回用户基本信息，以及token。

token ：存入 sessionStronge / localStronge中，然后加入到 封装好的 Axios 的 请求头中，每次请求携带token.
用户基本信息
登录成功后同时要做很多事情，具体业务具体对待。后台管理系统 登录成功后会请求当前用户的菜单权限接口，来获取用户的可访问的路由(动态路由)，获取成功后， Vue Router 是不能直接使用的，必须得解析成符合 Vue Router 可识别的格式 .

登录
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true;
          login(this.loginForm)
            .then(res => {
              if (res.code === 200) {
                // 存放token
                sessionStorage.setItem("tokens", res.data.token);
                // 触发Vuex 来 加载 获取当前用户的菜单，并解析路由
                store.dispatch("setMenuList");
                this.$message({
                  message: "登录成功",
                  type: "success",
                  duration: 1000
                });
                this.$router.replace({ path: "/dashboard" });
              }
            })
            .catch(() => {
              this.loading = false;
            });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    }
复制代码
获取当前用户菜单，解析路由
登录成功后，本文通过 Vuex 来获取当前用户菜单和解析路由的。

store.dispatch("setMenuList");

/*
 * @Description: 
 * @Author: ZhangXin
 * @Date: 2021-02-02 16:10:59
 * @LastEditTime: 2021-02-23 23:03:30
 * @LastEditors: ZhangXin
 */
// getMenu 解析后台路由
import { getMenu } from '../../utils/getMenu'
// 引入路由 和 静态路由
import router, { constantRoutes } from '../../router/index'
const state = {
  routerType: '',
  // 菜单路由
  meunList: []
}

const mutations = {
  SET_ROUTER_TYPE(state, type) {
    state.routerType = type
  },
  SET_ROUTER_MENULIST(state, list) {
    // 静态路由 +  动态路由  合并  完整路由
    const array = constantRoutes.concat(list)
    state.meunList = array
    router.options.routes = array
    router.addRoutes([...array])
  }
}

const actions = {
  setMenuList({ commit, state }) {
    // 接收返回来的 路由数组
    return new Promise((resolve, reject) => {
      getMenu().then(res => {
        commit('SET_ROUTER_TYPE', '')
        commit('SET_ROUTER_MENULIST', res)
        resolve(res)
      })
    })
  }
}
export default {
  state,
  mutations,
  actions
}
复制代码
解析后端返回来路由(重点)
封装好的解析后端返回来的路由，这块主要是为了在 Vuex 中使用。

/*
 * @Description: 
 * @Author: ZhangXin
 * @Date: 2021-02-02 16:03:48
 * @LastEditTime: 2021-02-23 23:09:02
 * @LastEditors: ZhangXin
 */
import Layout from '@/layout'
import {getUserAuthMenu} from '@/api/user'



/**
 * @description: 解析后端返回来的菜单树
 * @param {*} data 后端返回来的路由树
 * @param {*} arr 菜单
 * @return {*}
 */
function tree(data, arr) {
  data.forEach((datas, index) => {
    arr.push({
      path: datas.path,
      name: datas.name,
      types: datas.types,
      hidden: datas.hidden == 'true' ? true : false,
      // 当时这块踩坑了
      component: datas.component === 'Layout' ? Layout : resolve => require([`@/views/${datas.component}.vue`], resolve),
      meta: {
        title: datas.meta.title,
        icon: datas.meta.icon,
        // 用来存放按钮权限
        button: datas.meta.button
      },
      //  redirect: datas.redirect,
      id: datas.id,
      // 子路由
      children: []
    })

    if (datas.children) {
      const childArr = tree(datas.children, [])
      arr[index].children = childArr
    }
  })
  return arr
}


/**
 * @description: 获取当前登录用户的菜单
 * @param {*}
 * @return {*}
 */
export function getMenu() {
  return new Promise(function (resolve, reject) {
    getUserAuthMenu().then(res => {
      if(res.code === 200){
      const datas = res.data
      // 调用 tree 来解析后端返回来的树
      resolve(tree(datas, []))
      }

    })
  })
}

复制代码
后端接收路由格式

前端接收到的真实菜单树

页面刷新，路由丢失
到此为止，已经实现了 Vue 动态权限控制 ，别高兴的太早，哈哈，一刷新页面，页面就进入了 404 页面 。

这是为什么呢 ？
因为存入 Vuex 中的数据，一刷新页面，就会清空，那么当然找不到当前路由，就进入 404 页面了 .

如何处理呢？
**一、 可以 将 静态和 动态 构成的完整路由 存放在 sessionStronge / localStronge 中，然后页面刷新时，通过在 全局入口文件 App.vue 的 生命周期 created 中 ，将 router = sessionStronge / localStronge 存入的完整的路由，页面在刷新时，它会重新加载完整的路由。 **

二、如果是使用Vuex来获取和解析用户菜单的话， 那么你可以在全局入口文件 App.vue 的 生命周期 created 中 ，再次执行 Vuex Action 来重新加载用户菜单

我这块直接在 App.vue 的 生命周期 created 中 , 再次执行了 Vuex 来进行加载和解析，没有做其它操作。 当然了，具体业务具体对待。

<template>
  <div id="app">
    <router-view v-if="isRouterAlive" />
  </div>
</template>

<script>
import store from "@/store";
export default {
  name: "App",
  provide() {
    return {
      reload: this.reload
    };
  },
  data() {
    return {
      isRouterAlive: true
    };
  },
  methods: {
    reload() {
      this.isRouterAlive = false;
      this.$nextTick(() => (this.isRouterAlive = true));
    }
  },
  created() {
      //只要刷新页面，就会重新加载路由树，保证了路由不会丢失数据
	  store.dispatch("setMenuList");
  }
};
</script>

复制代码
总结
核心思想
1.定义符合 当前项目业务路由格式，前后端按这个接收传递
2.前端解析后端返回的动态路由，生成Vue Router 可识别格式，最后拼接完整路由
3.刷新路由丢失处理

按钮权限控制
1.当前组件 路由 携带可使用的 按钮权限，存入数组中，通过v-if 来判断是否显示
2.登录时，单独获取整个系统的按钮权限，将获取到的所有按钮 存入一个数组中，放入全局中，然后，通过 v-if 来判断是否显示
**3. ............ **


文章分类