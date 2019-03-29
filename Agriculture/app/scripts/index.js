// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

import TaskSystemArtifact from '../../build/contracts/TaskSystem.json'
import TaskAccountArtifact from '../../build/contracts/TaskAccount.json'

const TaskSystem = contract(TaskSystemArtifact)
const TaskAccount = contract(TaskAccountArtifact)

var defaultGas = 4700000;
var userAccount;
var userName;
var userTaskAccount;
var allTasks = [];

function isEmpty(str) {
  if(typeof str == "undefined" || str == null || str == ""){
    return true;
  }else{
    return false;
  }
}
const App = {
	init: async function () {
    const self = this
    TaskSystem.setProvider(web3.currentProvider)
    TaskAccount.setProvider(web3.currentProvider)

    // Load account data
    await web3.eth.getCoinbase(function(err, account)
    {
      if (err === null)
      {
        userAccount = account;
        console.log(userAccount)
      }
    });
//该instance.address是Tasksystem合约部署的地址，所以该instance是合约Tasksystem实例
    TaskSystem.deployed().then(async function (instance) {
      $("#plantformAccount").html(instance.address)
    }).catch(function (e) {
      toastr.clear()
      toastr.error("合约未部署")
    });

    TaskSystem.deployed().then(async function (instance) {
      userName = await self.getNameByAddress(userAccount)
      console.log(userName)
      if(isEmpty(userName)) {
        $("#usernameLi").hide()
      }
      else{
        $("#myName").html(userName);
        $("#myAccount").html(userAccount);
        $("#usernameLi").append(userName);
        $("#registerLi").hide()
        userTaskAccount = await self.getTaskAccountByUserAccount(userAccount);
      }
    }).catch(function (e) {
      console.log(e)
      $("#usernameLi").hide()
    })
	},
	register: function(name) {
    if(userAccount == undefined) {
      toastr.clear()
      toastr.error("未登录")
      return
    }
    if(isEmpty(name)) {
      toastr.clear()
      toastr.error("用户名不能为空")
      return
    }
    const self = this
    let TaskAccountAddress
    let TaskSystemInstance
    TaskSystem.deployed().then(function (instance) {
      TaskSystemInstance = instance;
      return TaskSystemInstance.getAddressByName.call(name).then(function (address) {
        if(address != "0x0000000000000000000000000000000000000000") {
          toastr.clear()
          toastr.error("用户名已被注册")
        }
        else {
          TaskAccount.new({from: userAccount, gas: defaultGas}).then(function (instance) {
            TaskAccountAddress = instance.address;
          }).then(function () {
            return TaskSystemInstance.register(TaskAccountAddress, name, {
              from: userAccount,
              gas: defaultGas
            }).then(async function () {
              toastr.clear()
              toastr.success("注册成功")
              userName = name;
              userTaskAccount = await self.getTaskAccountByUserAccount(userAccount);
              $("#myName").html(userName);
              $("#myAccount").html(userAccount);
              $("#registerTaskAccount").val("")
              $("#registerTaskName").val("")
              $("#registerModal").modal("hide")
              $("#registerLi").hide()
              $("#usernameLi").append(userName)
              $("#usernameLi").show()
              self.showRegisterUser()
            }).catch(function (e) {
              toastr.clear()
              toastr.error("注册失败")
            })
          });
        }
      }).catch(function (e) {
        toastr.clear()
        toastr.error("注册失败")
      })
    })
  },
  getTaskAccountByUserAccount: function (account) {
    var TaskSystemInstance;
    return TaskSystem.deployed().then(function (instance) {
      TaskSystemInstance = instance;
      return TaskSystemInstance.getContractByAddress.call(account)
    }).then(function (value) {
      return value;
    })
  },
  getTask: function(TaskAccountInstance, id){
    return TaskAccountInstance.getTask(id).then(function (task) {
      return {id: id, taskContent: task[1], timestamp: task[0].c[0], salary: task[2], workdays: task[3]};
    });
  },
	getTasksByAccount: function(account) {
    let tasks = [];
    const self = this
    var TaskAccountInstance
    return TaskAccount.at(account).then(function (instance) {
      TaskAccountInstance = instance;
      return TaskAccountInstance.getNumberOfTasks.call();
    }).then(async function (num) {
      for(var i = 0; i < num.c[0]; i++) {
        let task = await self.getTask(TaskAccountInstance, i);
        tasks.push(task);
      }
      return tasks;
    });
  },
  getAllTasks: async function() {
    const self = this
    allTasks = []
    let users = await self.getAllRegisterUser()
    for(var i = 0; i < users.length; i++) {
      let taskAccount = await self.getTaskAccountByUserAccount(users[i].address)
      let tasks = await self.getTasksByAccount(taskAccount)
      for(var j = 0; j < tasks.length; j++) {
        allTasks.push({taskId: tasks[j].id, username: users[i].username, taskContent: tasks[j].taskContent, timestamp: tasks[j].timestamp, salary: tasks[j].salary, workdays: tasks[j].workdays})
      }
    }
    allTasks.sort((a, b)=>{return b.timestamp - a.timestamp})
  },
  showAllTasks: async function() {
    const self = this
    await self.getAllTasks()
    $("#taskList").html("")
    for(var i = 0; i < allTasks.length; i++) {
      let task = allTasks[i]
      var date = new Date(task.timestamp*1000)
      $("#taskList").append("<tr><td>" + task.username + "</td><td>" + task.taskContent +"</td><td>" + task.salary +"</td><td>" + task.workdays + "</td><td>" +
      date.toLocaleDateString().replace(/\//g, "-") + " " + date.toTimeString().substr(0, 8) +
      "</td><td><button class='btn btn-primary' type='button' onclick='App.showApplicants("+i+")'>查看申请记录</button></td></tr>")
    }
  },
  showApplicants: async function(index) {
    const self = this
    $('#sendApplicantBtn').removeAttr("disabled")
    let taskAccount = await self.getTaskAccountByUsername(allTasks[index].username)
    let applicants = await self.getApplicants(taskAccount, allTasks[index].taskId)
    $("#applicantList").html("")
    for(let i = 0; i < applicants.length; i++){
      let applicant = applicants[i]
      let applicantUsername = await self.getNameByAddress(applicant[2])
      let date = new Date(applicant[1].c[0]*1000)
      $("#applicantList").append("<tr><td>" + applicantUsername + "</td><td>" + applicant[3] + "</td><td>" +
      date.toLocaleDateString().replace(/\//g, "-") + " " + date.toTimeString().substr(0, 8) + "</td></tr>")
    }
    $("#applicantModal").modal()
    $("#sendApplicantBtn").unbind("click")
    $("#sendApplicantBtn").click(async function () {
      await $('#sendApplicantBtn').attr("disabled","true");
      let success = await self.sendApplicant(taskAccount, allTasks[index].taskId)
      if(!success) {
        $('#sendApplicantBtn').removeAttr("disabled")
      }
    })
  },
  showApplicants2: async function(taskAccount, id) {
    const self = this
    $('#sendApplicantBtn').removeAttr("disabled")
    let applicants = await self.getApplicants(taskAccount, id)
    $("#applicantList").html("")
    for(let i = 0; i < applicants.length; i++){
      let applicant = applicants[i]
      let applicantUsername = await self.getNameByAddress(applicant[2])
      let date = new Date(applicant[1].c[0]*1000)
      $("#applicantList").append("<tr><td>" + applicantUsername + "</td><td>" + applicant[3] + "</td><td>" +
      date.toLocaleDateString().replace(/\//g, "-") + " " + date.toTimeString().substr(0, 8) + "</td></tr>")
    }
    $("#applicantModal").modal()
    $("#sendApplicantBtn").unbind("click")
    $("#sendApplicantBtn").click(async function () {
      await $('#sendApplicantBtn').attr("disabled","true");
      let success = await self.sendApplicant(taskAccount, id)
      if(!success) {
        $('#sendApplicantBtn').removeAttr("disabled")
      }
    })
  },
  getNameByAddress: function(account) {
    let TaskSystemInstance
    return TaskSystem.deployed().then(function (instance) {
      TaskSystemInstance = instance
      return TaskSystemInstance.getNameByAddress.call(account)
    })
  },
  getTaskAccountByUsername: function(username) {
    const self = this
    var TaskSystemInstance
    return TaskSystem.deployed().then(function (instance) {
      TaskSystemInstance = instance
      return TaskSystemInstance.getAddressByName.call(username).then(function (account) {
        return self.getTaskAccountByUserAccount(account)
      })
    })
  },
  sendTask: function() {
    if(userAccount == undefined) {
      toastr.clear()
      toastr.error("未登录")
      return
    }
    else {
      const self = this
      let content = $("#taskContent").val()
      let salary = $("#salary").val()
      let workdays = $("#workdays").val()
      let TaskAccountInstance
      if(userTaskAccount !== undefined) {
        TaskAccount.at(userTaskAccount).then(function (instance) {
          TaskAccountInstance = instance;
          return TaskAccountInstance.sendTask(content, salary,workdays,{from: userAccount, gas: defaultGas}).then(function () {
            $("#taskContent").val("");
            $("#salary").val("");
            $("#workdays").val("");
            self.showAccountTask(userTaskAccount);
            toastr.clear()
            toastr.success("发布成功")
          })
        })
      } else {
        toastr.clear()
        toastr.error("未注册")
      }
    }
  },
  sendApplicant: function(taskAccount, id) {
    if(userAccount == undefined) {
      toastr.clear()
      toastr.error("未登录")
      return
    }
    else {
      const self = this
      let content = $("#applicantContent").val()
      let TaskAccountInstance
      if(userTaskAccount !== undefined) {
        //第一个taskAccount是矿工的地址
        console.log(taskAccount)
        console.log(TaskAccount)
        return TaskAccount.at(taskAccount).then(function (instance) {
          TaskAccountInstance = instance
          return TaskAccountInstance.applyTask(id, content, {from: userAccount, gas: defaultGas}).then(function () {
            toastr.clear()
            toastr.success("申请成功")
            $("#applicantContent").val("")
            $("#applicantModal").modal("hide")
            return true
          }).catch(function (e) {
            toastr.clear()
            toastr.error("申请失败")
            return false
          })
        })
      }
      else {
        toastr.clear()
        toastr.error("未注册")
        return false
      }
    }
  },
  showAccountTask: async function(account) {
    const self = this;
    let tasks = [];
    if(account !== undefined) {
      tasks = await self.getTasksByAccount(account);
      $("#taskContentList").html('');
      for(var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var date = new Date(task.timestamp*1000);
        $("#taskContentList").append("<tr><td>" + task.id + "</td><td>" + task.taskContent + "</td><td>" +
        date.toLocaleDateString().replace(/\//g, "-") + " " + date.toTimeString().substr(0, 8) +
        "</td><td><button class='btn btn-primary' type='button' onclick='App.showApplicants2(\""+account+"\","+i+")'>查看申请记录</button></td></tr>")
      }
    }
  },
  getApplicants: function(taskAccount, id) {
    const self = this
    let TaskAccountInstance
    return TaskAccount.at(taskAccount).then(function (instance) {
      TaskAccountInstance = instance
      return TaskAccountInstance.getApplicantsLength.call(id).then(async function (num) {
        let applicants = []
        for(var i = 0; i < num.c[0]; i++) {
          applicants.push(await TaskAccountInstance.applicants.call(id, i).then(function (value) {
            return value;
          }))
        }
        return applicants;
      })
    })
  },
  showRegisterUser: function() {
    const self = this
    var TaskSystemInstance
    TaskSystem.deployed().then(function (instance) {
      TaskSystemInstance = instance;
      return TaskSystemInstance.getNumberOfAccounts.call()
    }).then(async function (num) {
      $("#registerUserList").html('');
      for(var i = 0; i < num.c[0]; i++) {
        let user = await self.getRegisterUser(TaskSystemInstance, i);
        $("#registerUserList").append("<tr><td>" + user.id + "</td><td>" + user.username + "</td><td>" + user.address + "</td></tr>");
      }
    })
  },
  getRegisterUser: function(TaskSystemInstance, id) {
    return TaskSystemInstance.getAddressById(id).then(function (address) {
      return TaskSystemInstance.getNameByAddress(address).then(function (name) {
        return {id: id, address: address, username: name}
      })
    })
  },
  getAllRegisterUser: function() {
    const self = this
    let users = []
    var TaskSystemInstance
    return TaskSystem.deployed().then(function (instance) {
      TaskSystemInstance = instance
      return TaskSystemInstance.getNumberOfAccounts.call()
    }).then(async function (num) {
      for(var i = 0; i < num.c[0]; i++) {
        let user = await self.getRegisterUser(TaskSystemInstance, i)
        users.push(user)
      }
      return users
    })
  }
}
window.App = App
window.onload = function () {
	// Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn(
      'Using web3 detected from external source.' +
      ' If you find that your accounts don\'t appear or you have 0 MetaCoin,' +
      ' ensure you\'ve configured that source properly.' +
      ' If using MetaMask, see the following link.' +
      ' Feel free to delete this warning. :)' +
      ' http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn(
      'No web3 detected. Falling back to http://127.0.0.1:9545.' +
      ' You should remove this fallback when you deploy live, as it\'s inherently insecure.' +
      ' Consider switching to Metamask for development.' +
      ' More info here: http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
  }

  App.init();
  App.showRegisterUser();
  App.showAllTasks();
	$("#registerBtn").click(function () {
		App.register($("#registerTaskName").val());
	});

  $("#home_tab").click(function (e) {
    e.preventDefault();
    App.showRegisterUser();
    App.showAllTasks();
  })

  $("#task_tab").click(function (e) {
    e.preventDefault();
    App.showAccountTask(userTaskAccount);
  })
  $("#sendtaskBtn").click(function () {
    App.sendTask();
  });

};
