pragma solidity ^0.4.18;

contract TaskAccount {

    struct Applicant{
        uint taskId;//任务id
        uint applyTime;
        address applicantAccount;
        string content;
    }
//任务需求结构
    struct Task {
        uint time;
        string content;
        uint salary;//薪水
        uint workdays;//工作时长
    }

    address _accountAddress;
    Task[] _tasks;
    //id任务下的所有申请者
    mapping(uint => Applicant[]) public applicants;
    //address public contractAddress;

    constructor() public {
        _accountAddress = msg.sender;
        //contractAddress = this;
    }

    modifier onlyAdmin {
        require(msg.sender == _accountAddress);
        _;
    }

    function sendTask(string memory _content, uint  _salary, uint  _workdays) public onlyAdmin {
        Task memory task = Task(now, _content , _salary, _workdays);
        _tasks.push(task);
    }

    function applyTask(uint id, string memory content) public {
        Applicant memory applicant = Applicant(id, now, msg.sender, content);
        applicants[id].push(applicant);
    }

    function getApplicantsLength(uint id) public view returns (uint) {
        return applicants[id].length;
    }

    function getNumberOfTasks() public view returns (uint) {
        return _tasks.length;
    }

    function getTask(uint id) public view returns (uint, string memory, uint, uint ) {
        return (_tasks[id].time, _tasks[id].content, _tasks[id].salary, _tasks[id].workdays);
    }

    function getAccountAddress() public view returns (address) {
        return _accountAddress;
    }
}
