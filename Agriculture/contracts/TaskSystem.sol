pragma solidity ^0.4.18;

contract TaskSystem {
    address _admin;
    mapping(address => string) _accounts;
    mapping(string => address) _usernames;
    mapping(address => address) _contractOfAccount;
    address[] _idOfAccount;

    constructor() public {
        _admin = msg.sender;
    }

    function register(address contractAddress, string memory name) public {
        require(bytes(_accounts[msg.sender]).length == 0, "该账户已注册过");
        require(_usernames[name] == address(0), "该用户名已被使用");

        _accounts[msg.sender] = name;
        _usernames[name] = msg.sender;
        _contractOfAccount[msg.sender] = contractAddress;
        _idOfAccount.push(msg.sender);
    }

    function getAddressByName(string memory name) public view returns (address) {
        return _usernames[name];
    }

    function getNameByAddress(address accountAddress) public view returns (string memory) {
        return _accounts[accountAddress];
    }

    function getNumberOfAccounts() public view returns (uint){
        return _idOfAccount.length;
    }

    function getContractByAddress(address accountAddress) public view returns (address) {
        return _contractOfAccount[accountAddress];
    }

    function getAddressById(uint id) public view returns (address) {
        return _idOfAccount[id];
    }
}
