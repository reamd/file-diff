const { exec } = require('child_process');
const path = require('path');
/**
 * 调用 macOS 的 diff 命令并解析输出
 * @param {string} file1 - 第一个文件路径
 * @param {string} file2 - 第二个文件路径
 */
function compareFiles(file1, file2) {
  return new Promise((resolve, reject) => {
    const diffCommand = `diff -u ${path.resolve(file1)} ${path.resolve(file2)}`;
    exec(diffCommand, (error, stdout, stderr) => {
      if (!stdout) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * 解析 diff 输出，提取行号和变更类型
 * @param {string} diffOutput - diff 命令的输出
 */
function parseDiffOutput(diffOutput) {
  const lines = diffOutput.split('\n');
  const result = [];
  const reg = /@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@/;
  let currLineNo = 1;
  let addCurrLineNo = 0;
  let delCurrLineNo = 0;
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (reg.test(line)) {
      currLineNo = Number(line.match(reg)[1]);
      addCurrLineNo = 0;
      delCurrLineNo = 0;
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      // 新增行
      result.push({ type: 'added', line: line.slice(1), lineNo: currLineNo + addCurrLineNo });
      addCurrLineNo++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // 删除行
      result.push({ type: 'removed', line: line.slice(1), lineNo: currLineNo + delCurrLineNo });
      delCurrLineNo++;
    } else if (!line.startsWith('+++') && !line.startsWith('---') && line !== '\\ No newline at end of file') {
      currLineNo++;
    }
  }
  return result;
}

// 主函数
export default async function main(file1, file2) {
  try {
    const diffOutput = await compareFiles(file1, file2);
    const changes = parseDiffOutput(diffOutput);
    return changes;
  } catch (error) {
    console.error('发生错误:', error.message);
  }
}

// 使用demo
// main('1.txt', '2.txt');