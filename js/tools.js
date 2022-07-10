/**
 * 检测
 * @param  {dom} obj
 * @param  {string} sClass
 */
 function hasClass(obj, sClass) {
  let re = new RegExp('\\b' + sClass + '\\b', 'g')
  return re.test(obj.className)
}

/**
 * 添加
 * @param  {dom} obj
 * @param  {string} sClass
 */
function addClass(obj, sClass) {
  if (hasClass(obj, sClass)) {
    obj.className = obj.className
  } else {
    obj.className += ' ' + sClass
  }
}

/**
 * 删除
 * @param  {dom} obj
 * @param  {string} sClass
 */
function removeClass(obj, sClass) {
  let re = new RegExp('\\b' + sClass + '\\b', 'g')
  obj.className = obj.className.replace(re, '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '')
}