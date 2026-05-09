/**
 * Nomad AI — Progressive Coding Problem Bank
 * Problems sourced from real coding challenge patterns (LeetCode, HackerRank, Codeforces style).
 * Organized by difficulty: Easy → Medium → Hard → Expert
 * Each click shows the next unseen problem, getting progressively harder.
 */

export const DIFFICULTY_LEVELS = [
  { id: "easy",   label: "Easy",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { id: "medium", label: "Medium", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  { id: "hard",   label: "Hard",   color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20" },
  { id: "expert", label: "Expert", color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
]

export const PROBLEMS = {
  easy: [
    {
      id: "e1",
      title: "Two Sum",
      source: "LeetCode #1",
      problem: "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. Each input has exactly one solution.",
      language: "python",
      code: `def two_sum(nums, target):
    """Find two indices whose values sum to target."""
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Example
print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
print(two_sum([3, 2, 4], 6))       # [1, 2]`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
    {
      id: "e2",
      title: "Reverse String",
      source: "LeetCode #344",
      problem: "Write a function that reverses a string in-place. The input is given as an array of characters.",
      language: "python",
      code: `def reverse_string(s):
    """Reverse array of chars in-place using two pointers."""
    left, right = 0, len(s) - 1
    while left < right:
        s[left], s[right] = s[right], s[left]
        left += 1
        right -= 1
    return s

# Example
print(reverse_string(["h","e","l","l","o"]))
# ['o', 'l', 'l', 'e', 'h']`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
    },
    {
      id: "e3",
      title: "Valid Parentheses",
      source: "LeetCode #20",
      problem: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      language: "javascript",
      code: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if ('({['.includes(char)) {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}

// Examples
console.log(isValid("(){}[]"));   // true
console.log(isValid("(]"));       // false
console.log(isValid("{[]}"));     // true`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
    {
      id: "e4",
      title: "FizzBuzz",
      source: "LeetCode #412",
      problem: "Given an integer n, return a string array where: answer[i] == 'FizzBuzz' if i is divisible by 3 and 5, 'Fizz' if divisible by 3, 'Buzz' if divisible by 5, or i (as string) otherwise.",
      language: "python",
      code: `def fizz_buzz(n):
    """Classic FizzBuzz with clean conditional logic."""
    result = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            result.append("FizzBuzz")
        elif i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(str(i))
    return result

# Example
print(fizz_buzz(15))
# ['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz',
#  '11','Fizz','13','14','FizzBuzz']`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
    {
      id: "e5",
      title: "Palindrome Number",
      source: "LeetCode #9",
      problem: "Given an integer x, return true if x is a palindrome, and false otherwise. Solve without converting to string.",
      language: "javascript",
      code: `function isPalindrome(x) {
  // Negative numbers are never palindromes
  if (x < 0 || (x % 10 === 0 && x !== 0)) return false;
  
  let reversed = 0;
  while (x > reversed) {
    reversed = reversed * 10 + x % 10;
    x = Math.floor(x / 10);
  }
  
  // Handle both even and odd digit counts
  return x === reversed || x === Math.floor(reversed / 10);
}

// Examples
console.log(isPalindrome(121));    // true
console.log(isPalindrome(-121));   // false
console.log(isPalindrome(12321));  // true`,
      timeComplexity: "O(log n)",
      spaceComplexity: "O(1)",
    },
  ],

  medium: [
    {
      id: "m1",
      title: "Longest Substring Without Repeating",
      source: "LeetCode #3",
      problem: "Given a string s, find the length of the longest substring without repeating characters using sliding window.",
      language: "python",
      code: `def length_of_longest_substring(s):
    """Sliding window approach for longest unique substring."""
    char_index = {}
    max_len = 0
    start = 0
    
    for end, char in enumerate(s):
        if char in char_index and char_index[char] >= start:
            start = char_index[char] + 1
        char_index[char] = end
        max_len = max(max_len, end - start + 1)
    
    return max_len

# Examples
print(length_of_longest_substring("abcabcbb"))  # 3 ("abc")
print(length_of_longest_substring("bbbbb"))     # 1 ("b")
print(length_of_longest_substring("pwwkew"))    # 3 ("wke")`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(min(m,n))",
    },
    {
      id: "m2",
      title: "Group Anagrams",
      source: "LeetCode #49",
      problem: "Given an array of strings, group the anagrams together. An anagram is a word formed by rearranging the letters of another word.",
      language: "python",
      code: `from collections import defaultdict

def group_anagrams(strs):
    """Group strings by sorted character signature."""
    groups = defaultdict(list)
    
    for word in strs:
        # Sort chars to create a canonical key
        key = tuple(sorted(word))
        groups[key].append(word)
    
    return list(groups.values())

# Example
result = group_anagrams(["eat","tea","tan","ate","nat","bat"])
print(result)
# [['eat','tea','ate'], ['tan','nat'], ['bat']]`,
      timeComplexity: "O(n * k log k)",
      spaceComplexity: "O(n * k)",
    },
    {
      id: "m3",
      title: "Binary Tree Level Order Traversal",
      source: "LeetCode #102",
      problem: "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
      language: "python",
      code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def level_order(root):
    """BFS level-order traversal using a queue."""
    if not root:
        return []
    
    result = []
    queue = deque([root])
    
    while queue:
        level_size = len(queue)
        level = []
        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    
    return result

# Example: [3,9,20,null,null,15,7] → [[3],[9,20],[15,7]]`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
    {
      id: "m4",
      title: "3Sum — Find Triplets",
      source: "LeetCode #15",
      problem: "Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j != k and nums[i] + nums[j] + nums[k] == 0.",
      language: "javascript",
      code: `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  
  for (let i = 0; i < nums.length - 2; i++) {
    // Skip duplicates for first element
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) left++;
      else right--;
    }
  }
  return result;
}

// Example
console.log(threeSum([-1, 0, 1, 2, -1, -4]));
// [[-1,-1,2], [-1,0,1]]`,
      timeComplexity: "O(n²)",
      spaceComplexity: "O(1)",
    },
    {
      id: "m5",
      title: "LRU Cache",
      source: "LeetCode #146",
      problem: "Design a data structure that follows the Least Recently Used (LRU) cache eviction policy. Implement get and put in O(1) time.",
      language: "python",
      code: `from collections import OrderedDict

class LRUCache:
    """O(1) LRU Cache using OrderedDict."""
    
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
    
    def get(self, key):
        if key not in self.cache:
            return -1
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            # Evict least recently used (first item)
            self.cache.popitem(last=False)

# Example
cache = LRUCache(2)
cache.put(1, 1)    # cache = {1:1}
cache.put(2, 2)    # cache = {1:1, 2:2}
print(cache.get(1)) # 1, cache = {2:2, 1:1}
cache.put(3, 3)    # evicts key 2, cache = {1:1, 3:3}
print(cache.get(2)) # -1 (evicted)`,
      timeComplexity: "O(1)",
      spaceComplexity: "O(capacity)",
    },
  ],

  hard: [
    {
      id: "h1",
      title: "Merge K Sorted Lists",
      source: "LeetCode #23",
      problem: "You are given an array of k linked lists, each sorted in ascending order. Merge all the linked lists into one sorted linked list and return it.",
      language: "python",
      code: `import heapq

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def merge_k_lists(lists):
    """Merge k sorted linked lists using a min-heap."""
    heap = []
    
    # Initialize heap with first node from each list
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))
    
    dummy = ListNode(0)
    current = dummy
    
    while heap:
        val, idx, node = heapq.heappop(heap)
        current.next = node
        current = current.next
        
        if node.next:
            heapq.heappush(heap, (node.next.val, idx, node.next))
    
    return dummy.next

# Time: O(N log k) where N = total nodes, k = number of lists
# Space: O(k) for the heap`,
      timeComplexity: "O(N log k)",
      spaceComplexity: "O(k)",
    },
    {
      id: "h2",
      title: "Trapping Rain Water",
      source: "LeetCode #42",
      problem: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
      language: "javascript",
      code: `function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let water = 0;
  
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }
  
  return water;
}

// Example
console.log(trap([0,1,0,2,1,0,1,3,2,1,2,1])); // 6
console.log(trap([4,2,0,3,2,5]));              // 9`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
    },
    {
      id: "h3",
      title: "Word Break II",
      source: "LeetCode #140",
      problem: "Given a string s and a dictionary of strings wordDict, add spaces in s to construct sentences where each word is valid. Return all possible sentences.",
      language: "python",
      code: `def word_break(s, word_dict):
    """Backtracking with memoization for word break."""
    word_set = set(word_dict)
    memo = {}
    
    def backtrack(start):
        if start in memo:
            return memo[start]
        if start == len(s):
            return [""]
        
        sentences = []
        for end in range(start + 1, len(s) + 1):
            word = s[start:end]
            if word in word_set:
                rest = backtrack(end)
                for r in rest:
                    if r:
                        sentences.append(word + " " + r)
                    else:
                        sentences.append(word)
        
        memo[start] = sentences
        return sentences
    
    return backtrack(0)

# Example
s = "catsanddog"
words = ["cat","cats","and","sand","dog"]
print(word_break(s, words))
# ["cats and dog", "cat sand dog"]`,
      timeComplexity: "O(n² * 2^n)",
      spaceComplexity: "O(n * 2^n)",
    },
    {
      id: "h4",
      title: "Median of Two Sorted Arrays",
      source: "LeetCode #4",
      problem: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).",
      language: "python",
      code: `def find_median(nums1, nums2):
    """Binary search on the shorter array."""
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    
    m, n = len(nums1), len(nums2)
    lo, hi = 0, m
    
    while lo <= hi:
        i = (lo + hi) // 2
        j = (m + n + 1) // 2 - i
        
        left1  = nums1[i-1] if i > 0 else float('-inf')
        right1 = nums1[i]   if i < m else float('inf')
        left2  = nums2[j-1] if j > 0 else float('-inf')
        right2 = nums2[j]   if j < n else float('inf')
        
        if left1 <= right2 and left2 <= right1:
            if (m + n) % 2 == 0:
                return (max(left1, left2) + min(right1, right2)) / 2
            return max(left1, left2)
        elif left1 > right2:
            hi = i - 1
        else:
            lo = i + 1

# Example
print(find_median([1, 3], [2]))       # 2.0
print(find_median([1, 2], [3, 4]))    # 2.5`,
      timeComplexity: "O(log(min(m,n)))",
      spaceComplexity: "O(1)",
    },
  ],

  expert: [
    {
      id: "x1",
      title: "Solana Token Swap (On-Chain)",
      source: "Web3 / Anchor",
      problem: "Write an Anchor smart contract that implements a basic token swap pool with constant-product AMM (x * y = k) on Solana.",
      language: "rust",
      code: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("SwapXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod nomad_swap {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitPool>, fee_bps: u16) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.token_a_vault = ctx.accounts.vault_a.key();
        pool.token_b_vault = ctx.accounts.vault_b.key();
        pool.fee_bps = fee_bps;
        pool.bump = ctx.bumps.pool;
        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
        let reserve_a = ctx.accounts.vault_a.amount;
        let reserve_b = ctx.accounts.vault_b.amount;
        
        // Constant product: (x + dx) * (y - dy) = x * y
        let fee = amount_in * (ctx.accounts.pool.fee_bps as u64) / 10000;
        let net_in = amount_in - fee;
        let amount_out = (reserve_b * net_in) / (reserve_a + net_in);
        
        require!(amount_out > 0, SwapError::ZeroOutput);
        
        // Transfer in
        token::transfer(ctx.accounts.deposit_ctx(), amount_in)?;
        // Transfer out
        token::transfer(ctx.accounts.withdraw_ctx(), amount_out)?;
        
        emit!(SwapEvent { amount_in, amount_out, fee });
        Ok(())
    }
}

#[error_code]
pub enum SwapError {
    #[msg("Output amount is zero")]
    ZeroOutput,
}

#[event]
pub struct SwapEvent {
    pub amount_in: u64,
    pub amount_out: u64,
    pub fee: u64,
}`,
      timeComplexity: "O(1) per swap",
      spaceComplexity: "O(1)",
    },
    {
      id: "x2",
      title: "Merkle Airdrop Distributor",
      source: "Web3 / Solidity",
      problem: "Implement a gas-efficient Merkle tree-based airdrop contract where users prove their claim eligibility using Merkle proofs instead of storing all recipients on-chain.",
      language: "solidity",
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleAirdrop {
    IERC20 public immutable token;
    bytes32 public immutable merkleRoot;
    mapping(address => bool) public claimed;

    event Claimed(address indexed account, uint256 amount);

    constructor(address _token, bytes32 _root) {
        token = IERC20(_token);
        merkleRoot = _root;
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {
        require(!claimed[msg.sender], "Already claimed");
        
        // Verify Merkle proof
        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(msg.sender, amount)))
        );
        require(
            MerkleProof.verify(proof, merkleRoot, leaf),
            "Invalid proof"
        );
        
        claimed[msg.sender] = true;
        token.transfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }
    
    // Recover unclaimed tokens after deadline
    function sweep(address to) external {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(to, balance);
    }
}`,
      timeComplexity: "O(log n) per claim",
      spaceComplexity: "O(1) per claim",
    },
    {
      id: "x3",
      title: "Async Rate Limiter",
      source: "System Design",
      problem: "Implement a sliding window rate limiter for an API that supports concurrent requests. Should allow N requests per window and queue excess requests.",
      language: "javascript",
      code: `class SlidingWindowRateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.timestamps = [];
    this.queue = [];
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this._processQueue();
    });
  }

  _processQueue() {
    const now = Date.now();
    // Remove expired timestamps
    this.timestamps = this.timestamps.filter(
      t => now - t < this.windowMs
    );

    while (
      this.queue.length > 0 &&
      this.timestamps.length < this.maxRequests
    ) {
      const { fn, resolve, reject } = this.queue.shift();
      this.timestamps.push(now);
      
      Promise.resolve()
        .then(() => fn())
        .then(resolve)
        .catch(reject);
    }

    // Schedule retry for remaining queue items
    if (this.queue.length > 0) {
      const oldest = this.timestamps[0];
      const retryIn = this.windowMs - (now - oldest) + 10;
      setTimeout(() => this._processQueue(), retryIn);
    }
  }
}

// Usage: 5 requests per second
const limiter = new SlidingWindowRateLimiter(5, 1000);
const fetchData = (id) => limiter.execute(
  () => fetch(\`/api/data/\${id}\`).then(r => r.json())
);`,
      timeComplexity: "O(n) per call",
      spaceComplexity: "O(n + q)",
    },
    {
      id: "x4",
      title: "Concurrent Task Scheduler",
      source: "System Design",
      problem: "Build a task scheduler that runs async tasks with a configurable concurrency limit, priority queue, retry logic, and cancellation support.",
      language: "python",
      code: `import asyncio
import heapq
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Coroutine

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass(order=True)
class Task:
    priority: int
    id: str = field(compare=False)
    fn: Callable = field(compare=False, repr=False)
    retries: int = field(default=3, compare=False)
    status: TaskStatus = field(default=TaskStatus.PENDING, compare=False)
    result: Any = field(default=None, compare=False)

class TaskScheduler:
    def __init__(self, concurrency=4):
        self.concurrency = concurrency
        self.queue = []
        self.running = set()
        self.semaphore = asyncio.Semaphore(concurrency)
    
    def submit(self, task_id, fn, priority=0, retries=3):
        task = Task(priority=priority, id=task_id, fn=fn, retries=retries)
        heapq.heappush(self.queue, task)
        return task
    
    async def _run_task(self, task):
        async with self.semaphore:
            task.status = TaskStatus.RUNNING
            self.running.add(task.id)
            for attempt in range(task.retries):
                try:
                    task.result = await task.fn()
                    task.status = TaskStatus.DONE
                    break
                except Exception as e:
                    if attempt == task.retries - 1:
                        task.status = TaskStatus.FAILED
                        task.result = str(e)
            self.running.discard(task.id)
    
    async def run_all(self):
        tasks = []
        while self.queue:
            task = heapq.heappop(self.queue)
            if task.status != TaskStatus.CANCELLED:
                tasks.append(self._run_task(task))
        await asyncio.gather(*tasks)

# Usage
scheduler = TaskScheduler(concurrency=3)
scheduler.submit("fetch_price", fetch_sol_price, priority=1)
scheduler.submit("send_tx", broadcast_transaction, priority=0)`,
      timeComplexity: "O(n log n)",
      spaceComplexity: "O(n)",
    },
  ],
}

/**
 * Get the ordered list of all problems (easy → expert).
 * Used by the component to show problems progressively.
 */
export function getAllProblemsOrdered() {
  return [
    ...PROBLEMS.easy,
    ...PROBLEMS.medium,
    ...PROBLEMS.hard,
    ...PROBLEMS.expert,
  ]
}

/**
 * Get difficulty info for a given problem index.
 */
export function getDifficultyForIndex(index) {
  const easyCount = PROBLEMS.easy.length
  const mediumCount = PROBLEMS.medium.length
  const hardCount = PROBLEMS.hard.length

  if (index < easyCount) return DIFFICULTY_LEVELS[0]
  if (index < easyCount + mediumCount) return DIFFICULTY_LEVELS[1]
  if (index < easyCount + mediumCount + hardCount) return DIFFICULTY_LEVELS[2]
  return DIFFICULTY_LEVELS[3]
}
