pragma solidity ^0.4.4;

import "./contracts/Tokens/contracts/StandardToken.sol";

contract ERC20 is StandardToken{
  
  uint256 public totalSupply = 100;
 
  function ERC20() {
    balances[msg.sender] = totalSupply; 
  }
}
