import { detectLanguage } from './utils/detector.js';

const leetCodeCpp = `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int>mp;
        for(int i = 0 ; i < nums.size(); i++){
            int rem = target - nums[i];
            if(mp.find(rem)!=mp.end()){
                return{i,mp[rem]};
            }
            mp[nums[i]] = i ; 
        }
        return {};
    }
};
`;

const leetCodeJava = `
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}
`;

const leetCodePython = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        prevMap = {} # val : index
        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i
        return
`;

console.log('--- LeetCode Detection Test ---');
console.log('C++ Snippet:', detectLanguage(leetCodeCpp));
console.log('Java Snippet:', detectLanguage(leetCodeJava));
console.log('Python Snippet:', detectLanguage(leetCodePython));
