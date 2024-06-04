
const formattedMoney = value => {
	// 使用逗号作为千分位分隔符,将格式化后的金额转换为字符串
	var numberFormat = new Intl.NumberFormat("en-US", {
		style: "decimal",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
	return numberFormat.format(value);
}

const replaceCommaWithDot = value => String(value).replace(/,/g, "")

// 依赖收集、派发更新
class Dep {
	constructor() {
		this.allUpdateFns = {}
	}
	depend(key, updateFns) {
		this.allUpdateFns[key] = updateFns
	}
	notify(key) {
		const updateFns = this.allUpdateFns[key] || []
		updateFns.forEach(fn => fn())
	}
	filter(key, fn) {
		const fns = this.allUpdateFns[key] || []
		this.allUpdateFns[key] = fns.filter(f => f === fn)
	}
}

// 事件监听器
class Event {
	constructor() {
		this.objFn = {}
	}
	$emit(eventName, ...arg) {
		const fns = this.objFn[eventName] || []
		fns.forEach(fn => fn(arg))
	}
	$on(eventName, fn) {
		const fns = this.objFn[eventName] || []
		fns.push(fn)

		this.objFn[eventName] = fns
	}
}

// 创建全局监听器
const globalEvent = new Event()

class Radio {
	constructor({
		selector,
		field,
		value,
		inputData,
	}) {
		this.selector = selector
		this.field = field
		this.value = value
		this.inputData = inputData

		const originalRadio = document.querySelector(selector)
		const el = originalRadio.cloneNode(true)
		el.removeAttribute('id')
		el.classList.remove('hidden')
		this.el = el

		let realityValue = value
		Object.defineProperty(this, 'value', {
			get() {
				return realityValue
			},
			set(newVal) {
				realityValue = newVal
				
				const radioEl = el.querySelector(`input[type="radio"][value="${newVal}"]`)
				radioEl && (radioEl.checked = true)

				if (inputData[field].value === newVal) return
				inputData[field].value = newVal
			}
		})
		this.createEvent()
	}

	createEvent() {
		this.el.onchange = e => {
			this.value = e.target.value
		}
	}
}

class Select {
	constructor({
		selector,
		field,
		value,
		inputData,
	}) {
		this.selector = selector
		this.field = field
		this.value = value
		this.inputData = inputData

		const originalSelect = document.querySelector(selector)
		const el = originalSelect.cloneNode(true)
		el.removeAttribute('id')
		el.classList.remove('hidden')
		this.el = el

		let realityValue = value
		Object.defineProperty(this, 'value', {
			get() {
				return realityValue
			},
			set(newVal) {
				el.value = realityValue = newVal
				if (inputData[field].value === newVal) return
				inputData[field].value = newVal
			}
		})
		this.createEvent()
	}

	createEvent() {
		this.el.onchange = e => {
			this.value = e.target.value
		}
	}
}

class InputSearch {
	constructor({
		selector,
		field,
		rowName,
		key,
		value,
		options = [],
		inputData,
		pagination = {
			page: 1,
			pageSize: 10,
			total: 0,
		},
		randerFiled = {
			text: 'text',
			value: 'value',
		},
		getServerData,
		liClickCallback,
		customizableInput,
	}) {
		this.field = field
		this.key = key
		this.rowName = rowName
		this.value = value
		this.options = options
		this.inputData = inputData
		this.pagination = pagination
		this.getData = getServerData
		this.liClickCallback = liClickCallback
		this.randerFiled = randerFiled
		this.customizableInput = customizableInput

		this.el = null
		this.inputEl = null
		this.optionsEl = null
		this.ulEl = null
		this.emptyEl = null
		this.loadingEl = null
		this.isClickLi = false
		
		selector && this.setOptions(selector)

		const _this = this
		let realityValue = value
		Object.defineProperty(this, 'value', {
			get() {
				return realityValue
			},
			set(newVal) {
				realityValue = newVal
				_this.inputEl.value = newVal
				if (inputData[field].value === newVal) return
				inputData[field].value = newVal
			}
		})
		this.createEl()
	}

	setOptions(selector) {
		const originalSelect = document.querySelector(selector)
		const options = originalSelect.querySelectorAll('option') || []
		this.options = [...options].map(option => ({
			[this.randerFiled.text] :option.value,
		})).filter(option => option[this.randerFiled.text])

	}

	createEl() {
		// 创建一个IntersectionObserver实例
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (!entry.isIntersecting) return
				if (timer) return
				randerLi(this.value)
			});
		});

		const randerLi = async (value) => {
			if (typeof this.getData === 'function') {
				try {
					
					const data = await this.getData({ value, ...this.pagination })
					const liEls = this.createLiEl(data.data)
					this.ulEl.appendChild(liEls)
					Object.assign(this.pagination, {
						page: this.pagination.page + 1,
						total: data.total
					})

					const { page, pageSize, total } = this.pagination

					if (!total) this.emptyEl.style.display = 'block'
					else this.emptyEl.style.display = 'none'

					if (page * pageSize >= total) {
						this.loadingEl.style.display = 'none'
					}
				} catch {
					
				}
			} else {
				this.loadingEl.style.display = 'none'

				this.ulEl.innerHTML = ''
				const filterOptions = this.options.filter(option => option[this.randerFiled.text].includes(value))
				this.emptyEl.style.display = filterOptions.length ? 'none' : 'block'
				const liEls = this.createLiEl(filterOptions)
				this.ulEl.appendChild(liEls)
			}
		}

		const { value } = this
		const searchInputEl = document.createElement('div')
		searchInputEl.classList.add('searchInput')

		searchInputEl.innerHTML = `<svg data-v-cc0be98c="" fill="none" viewBox="0 0 24 24" width="1em" height="1em" class="t-icon t-icon-chevron-up">
		<path data-v-cc0be98c="" fill="currentColor" d="M17.5 15.91l-5.5-5.5-5.5 5.5-1.41-1.41L12 7.59l6.91 6.91-1.41 1.41z">
		</path>
	</svg>`

		this.el = searchInputEl

		let timer = null
		const inputEl = document.createElement('input')
		inputEl.setAttribute('type', 'text')
		inputEl.setAttribute('value', value)
		inputEl.setAttribute('placeholder', '请选择')
		inputEl.classList.add('td_edit')
		inputEl.oninput = async e => {
			this.isClickLi = false
			this.ulEl.innerHTML = ''
			this.loadingEl.style.display = 'block'
			this.emptyEl.style.display = 'none'
			Object.assign(this.pagination, { page: 1, total: 0 })

			if (timer) clearTimeout(timer)
			await new Promise(resolve => timer = setTimeout(resolve, 500))
			timer = null

			const value = e.target.value
			randerLi(value)
		}
		inputEl.onfocus = async () => {
			if (window.innerHeight - inputEl.getBoundingClientRect().bottom - 44 <= 200) {
				this.optionsEl.childNodes[0].style.bottom = '40px'
				this.optionsEl.childNodes[0].style.top = 'initial'
			}
			this.ulEl.innerHTML = ''
			this.loadingEl.style.display = 'block'
			this.emptyEl.style.display = 'none'
			Object.assign(this.pagination, { page: 1, total: 0 })

			this.optionsEl.style.opacity = 1
			this.optionsEl.style.display = 'block'
			this.inputEl.select()

			if (timer) clearTimeout(timer)
			await new Promise(resolve => timer = setTimeout(resolve, 500))
			timer = null
			randerLi(this.value)
		}
		inputEl.onblur = e => {
			setTimeout(() => {
				this.optionsEl.style.opacity = 0
				this.optionsEl.style.display = 'none'
				if (this.isClickLi || this.customizableInput) this.value = e.target.value
				else e.target.value = this.value
				
			}, 200)
		}
		this.inputEl = inputEl

		const optionsEl = document.createElement('div')
		optionsEl.classList.add('options')
		this.optionsEl = optionsEl

		searchInputEl.appendChild(inputEl)
		searchInputEl.appendChild(optionsEl)

		const divEl = document.createElement('div')

		optionsEl.appendChild(divEl)

		const ulEl = document.createElement('ul')
		this.ulEl = ulEl

		const emptyEl = document.createElement('div')
		emptyEl.classList.add('empty')
		emptyEl.innerHTML = '暂无数据'
		this.emptyEl = emptyEl

		const loadingEl = document.createElement('div')
		loadingEl.classList.add('loading')
		loadingEl.innerHTML = `<svg focusable="false" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="0 0 1024 1024"><path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path></svg>`
		// 监听指定的DOM元素
		observer.observe(loadingEl);
		this.loadingEl = loadingEl

		divEl.appendChild(ulEl)
		divEl.appendChild(emptyEl)
		divEl.appendChild(loadingEl)

		randerLi(this.value)
	}

	createLiEl(data = []) {
		const liFragment = document.createDocumentFragment()
		const textFiled = this.randerFiled.text
		for (let index = 0; index < data.length; index++) {
			const item = data[index]
			
			const liEl = document.createElement('li')
			liEl.classList.add('ellipsis')
			liEl.innerText = item[textFiled]
			liEl.title = item[textFiled]
			liEl.onclick = () => {
				const currentActiveEl = this.ulEl.querySelector('.active')
				if (currentActiveEl) {
					currentActiveEl.classList.remove('active')
				}
				liEl.classList.add('active')
				this.value = item[textFiled]
				this.inputEl.value = item[textFiled]
				this.isClickLi = true
				this.liClickCallback && this.liClickCallback({ item, rowName: this.rowName, inputData: this.inputData })
			}

			liFragment.appendChild(liEl)
		}
		return liFragment
	}
}

// input渲染类
class Input {
	constructor({
		field,
		key,
		value,
		xFormula = '',  // 计算方式
		yFormula = '',  // 计算方式
		sFormula = '',
		xFormulaMode = '',
		yFormulaMode = '',
		xExclude = [],
		yExclude = [],
		needVerification = false, // 是否需要校验input值
		maxLength = '17', // 最大长度
		inputData,
		rowName,
		rowData,
		colData,
		variable = {},
		isReadOnly = false,
		dep,
		eventBus,
		tableLinkage,
		tableLinkageFieldList = [],
		formatValue,
		formatOriginValue,
		changeOValue = false,
	}) {
		if (Object.prototype.toString.call(tableLinkage) === '[object Object]') {
			const { eventName, callback } = tableLinkage
			globalEvent.$on(eventName, callback)
		}

		this.formatValue = formatValue

		this.dep = dep
		this.eventBus = eventBus

		const el = document.createElement('input')

		el.setAttribute('type', 'text')
		el.setAttribute('value', value)
		el.classList.add('td_edit')
		if (isReadOnly) {
			el.setAttribute('readOnly', true)
			el.setAttribute('data-field', field)
			el.classList.add('td_edit_readOnly')
		}
		this.el = el

		this.key = key
		this.value = value
		this.xFormula = xFormula
		this.yFormula = yFormula
		this.sFormula = sFormula
		this.xFormulaMode = xFormulaMode
		this.yFormulaMode = yFormulaMode
		this.xExclude = xExclude
		this.yExclude = yExclude
		this.needVerification = needVerification
		this.maxLength = maxLength
		this.inputData = inputData
		this.rowName = rowName
		this.field = field
		this.variable = variable
		this.rowData = rowData
		this.colData = colData

		this.waitDelFormulafn = {}

		this.parseFormula()
		let realityValue = value
		Object.defineProperty(this, 'value', {
			get() {
				return realityValue
			},
			set(newVal) {
				if (tableLinkageFieldList.length) {
					const list = tableLinkageFieldList.map(key => {
						if (key === field) return newVal
						return inputData[key].value
					})
					globalEvent.$emit(tableLinkage, ...list)
				}

				if (isReadOnly) {
					el.setAttribute('title', newVal)
					const customEvent = new CustomEvent('customChange', {
							detail: {
								message: newVal
							}
					})
					el.dispatchEvent(customEvent)
				}
				
				el.value = realityValue = newVal

				if (changeOValue && formatOriginValue && typeof formatOriginValue === 'function') {
					inputData[field].oValue = formatOriginValue(newVal)
				}

				if (inputData[field].value === newVal) return
				inputData[field].value = newVal
			}
		})
		if (!isReadOnly) this.createEvent()
		this.eventListeners()
	}

	eventListeners() {
		this.eventBus.$on('changFormula', () => {
			this.changFormula()
			this.parseFormula()
		})
	}

	changFormula() {
		const { waitDelFormulafn } = this

		Object.keys(waitDelFormulafn).forEach(key => {
			delete waitDelFormulafn[key]
			this.dep.filter(key, waitDelFormulafn[key])
		})
	}

	parseFormula() {
		if (this.yFormulaMode === 'allY') {
			const { rowData, rowName, yExclude } = this
			this.yFormula = rowData.map(row => {
				if (row.rowName === rowName || yExclude.includes(row.rowName)) return '0'
				return `[${row.rowName}]`
			}).join(' + ')
		}
		if (this.xFormulaMode === 'allX') {
			const { field, colData, rowName } = this

			this.xFormula = colData.map(col => {
				if (col.key + rowName === field) return '0'
				return `[${col.key + rowName}] + `
			}).join('')

		}

		this.parseSFormula()
		this.parseXFormula()
		this.parseYFormula()
	}

	parseSFormula() {
		let { sFormula: formula } = this
		if (!formula) return

		const rgx = /( \+ | - | * | \/)/
		const computeArr = formula.split(rgx).map(s => s.replace(',', ''))
		const fields = computeArr.filter(s => /^\[.*\]$/.test(s))

		this.depend({ computeArr, fields })
	}

	parseXFormula() {
		let { xFormula: formula, rowName } = this
		if (!formula) return

		const rgx = /( \+ | - | * | \/)/
		// const operators = ['+', '-', '*', '/', '(', ')']
		const computeArr = formula.split(rgx)
		const fields = computeArr.filter(s => /^\[.*\]$/.test(s))

		this.depend({ computeArr, fields, splicingStr: rowName })
	}

	parseYFormula() {
		let { yFormula: formula, key } = this
		if (!formula) return
		const rgx = /( \+ | - | * | \/)/
		let computeArr = formula.split(rgx)

		computeArr = computeArr.map(s => {
			if (!/^\[.*\]$/.test(s)) return s

			const newS = key + s.slice(s.includes('$') ? 2 : 1, -1).trim()
			return `[${newS}]`
		})
		const fields = computeArr.filter(s => /^\[.*\]$/.test(s))

		this.depend({ computeArr, fields })
	}

	depend({ computeArr, fields, splicingStr = '' }) {
		fields = fields.filter(s => !s.includes('$'))

		fields.forEach(field => {
			const key = field.slice(1, -1).trim() + splicingStr
			const updateFns = this.dep.allUpdateFns[key] || []

			const fn = () => {
				// 提取并赋值变量
				const formula = computeArr.map(s => {
					if (/^\{.*\}$/.test(s)) {
						const variableName = s.slice(1, -1).trim()
						return this.variable[variableName]
					}
					if (/^\[.*\]$/.test(s)) {
						const key = s.slice(1, -1).trim() + splicingStr
						let value = String(this.inputData[key]?.value)

						if (value.endsWith('%')) value = value.slice(0, -1) / 100

						if (s.includes('$')) value = String(this.inputData[s.slice(2, -1).trim() + splicingStr].oValue)
						value = replaceCommaWithDot(value)
					
						return isNaN(+value) ? `'${value}'` : +value
					}

					return s
				}).join('').replace('，', ',')
				const newVal = new Function('return ' + formula)()
				const { formatValue } = this
				this.value = formatValue && typeof formatValue === 'function' ? formatValue(newVal) : formattedMoney(newVal)
			}
			updateFns.push(fn)
			this.dep.depend(key, updateFns)

			if (this.yFormulaMode === 'allY' || this.xFormulaMode === 'allX') {
				this.waitDelFormulafn[key] = fn
			}
		})
	}

	createEvent() {
		this.el.onfocus = e => {
			if (this.needVerification) return
			const value = replaceCommaWithDot(this.value)
			
			if (this.formatValue && typeof this.formatValue === 'function') {
				this.value = this.formatValue(value)
			} else {
				this.value = Boolean(+value) ? +value : '';
			}

			e.target.select()
		}

		this.el.onblur = () => {
			if (this.needVerification) return

			if (this.formatValue && typeof this.formatValue === 'function') {
				const value = this.el.value
				this.value = this.formatValue(value)
				return
			}
			this.blurInput()
		}
	}

	blurInput() {
		const value = this.el.value
		// 获取原始值
		var newValue = "0.00";
		//去掉逗号
		var rValue = replaceCommaWithDot(value);
		// 检查输入值是否为数字
		if (!isNaN(rValue) && !isNaN(parseFloat(rValue))) {
			// 转换为浮点数
			var floatValue = parseFloat(rValue);
			// 检查转换后的浮点数是否为 NaN
			if (!isNaN(floatValue)) {
				// 格式化为字符串,保留两位小数
				var formattedValue = floatValue.toFixed(2);
				// 如果格式化后的小数点后位数不足两位,则在末尾添加零
				if (
					formattedValue.indexOf(".") === -1 ||
					formattedValue.substring(formattedValue.indexOf(".") + 1).length < 2
				) {
					formattedValue += "0";
				}
				// 限制输入长度不超过17个字符
				if (formattedValue.length > 17) {
					formattedValue = formattedValue.substring(0, 17);
				}
				newValue = formattedMoney(formattedValue);
			}
		}
		this.value = newValue
	}
}

class Rander {
	constructor({
		rowData,
		colData,
		separateConfig,
		unique,
		activeComputing,
		dep,
		eventBus,
	}) {
		this.dep = dep
		this.eventBus = eventBus

		this.tableLinkageList = {}

		this.rowData = rowData
		this.colData = colData
		this.separateConfig = separateConfig
		this.inputs = []
		this.InputSearchs = []
		this.selects = []
		this.radios = []
		this.unique = String(unique)
		this.activeComputing = activeComputing

		this.waitFixedTd = []
		this.addBtnEl = null

		this.selector = ''

		const { randerList, inputData } = this.handleData({
			rowData: this.rowData,
			colData: this.colData,
		})
		this.randerList = randerList || []
		this.inputData = inputData || {}

		this.waitRanderTemplate = this.generateRanderTemplate(this.randerList)

		this.responsiveness(this.inputData)
	}

	handleData(data) {
		const randerList = []
		const inputData = {}
		const { rowData, colData } = data

		rowData.forEach((row, rowIndex) => {
			const randerItems = []

			let {
				rowName,
				tRowName,
				variable: yv = {},
				formulas: {
					formula: yFormula = '',
					independ: yIndependFormula = {},
					exclude: yExclude = [],
					mode: yFormulaMode = '',
				} = {}
			} = row || {}
			const rowConfig = Object.assign({}, row)
			delete rowConfig.variable
			delete rowConfig.formulas

			colData.forEach(col => {
				let yf = yFormula
				let {
					key,
					textList = [],
					variable: xv = {},
					formulas: {
						formula: xFormula = '',
						independ: xIndependFormula = {},
						exclude: xExclude = [],
						mode: xFormulaMode = '',
					} = {}
				} = col || {}
				const separateConfigKey = `[${key},${rowName}]`
				const colConfig = Object.assign({}, col)
				delete colConfig.variable
				delete colConfig.formulas

				const {
					formulas: {
						formula: sFormula,
						xMode,
						yMode,
					} = {}
				} = this.separateConfig[separateConfigKey] || {}
				const separateConfig = Object.assign({}, this.separateConfig[separateConfigKey])
				delete separateConfig.formulas

				const variable = Object.assign(xv, yv)

				xFormulaMode = xMode || xFormulaMode
				yFormulaMode = yMode || yFormulaMode

				yf = yIndependFormula[key] || yf
				if (yExclude.includes(key)) yf = ''

				xFormula = xIndependFormula[rowName] || xFormula
				if (xExclude.includes(rowName)) xFormula = ''
				const obj = {
					...col,
					...rowConfig,
					...colConfig,
					...(textList.length ? { text: textList[rowIndex] } : {}),
					...separateConfig,
					rowName,
					tRowName,
					variable,
					xFormula,
					yFormula: yf,
					sFormula,
					yFormulaMode,
					xFormulaMode,
					xExclude,
					yExclude,
				}

				obj.oValue = obj.oValue || obj.value

				if (typeof obj.tableLinkage === 'string') {
					const list = this.tableLinkageList[obj.tableLinkage] || []

					this.tableLinkageList[obj.tableLinkage] = list.concat(key + rowName)
				}
				randerItems.push(obj)
				inputData[key + rowName] = obj
			})
			randerList.push(randerItems)
		})

		return { randerList, inputData }
	}

	updateFieldValue(k, v) {
		this.inputData[k].value = v
	}

	responsiveness(data) {
		const { activeComputing, dep } = this
		const form = [...this.inputs, ...this.InputSearchs, ...this.selects, ...this.radios]

		Object.keys(data).forEach(key => {
			let value = data[key].value
			Object.defineProperty(data[key], 'value', {
				get() {
					return value
				},
				set(newVal) {
					const formItem = form.find(input => input.field === key)
					if (!formItem) return

					formItem.value = value = newVal
					// 通知计算
					if (!activeComputing) return dep.notify(key)

					Promise.resolve().then(() => dep.notify(key))
				}
			})
		})
	}

	generateRanderTemplate(randerList) {
		const waitRanderTemplate = document.createDocumentFragment()

		randerList.forEach(tr => {
			const trDom = document.createElement('tr')

			tr.forEach(td => {
				const { colspan = 1, rowspan = 1, isShow = true, fixed } = td
				if (!isShow) return

				const tdDom = document.createElement('td')
				tdDom.setAttribute('colspan', colspan)
				tdDom.setAttribute('rowspan', rowspan)

				const childNode = this.generateChildNode(td, trDom)
				tdDom.appendChild(childNode)

				trDom.appendChild(tdDom)

				if (fixed) this.waitFixedTd.push(tdDom)
			})
			waitRanderTemplate.appendChild(trDom)
		})
		return waitRanderTemplate
	}

	generateChildNode(td, trDom) {
		const {
			key,
			rowName,
			childNodeType = 'input',
			selector,
			text = '--',
			value,
			addRowName,
			insertMode,
			tableLinkage,
		} = td

		if (value) td.value = value

		if (['input', 'readOnly'].includes(childNodeType)) {
			const { inputData, colData, rowData } = this
			const isReadOnly = childNodeType === 'readOnly'
			const field = key + rowName
			const input = new Input({
				...td,
				tableLinkageFieldList: this.tableLinkageList[tableLinkage],
				field,
				isReadOnly,
				inputData,
				rowData,
				colData,
				dep: this.dep,
				eventBus: this.eventBus,
			})
			this.inputs.push(input)

			return input.el
		}

		if (childNodeType === 'inputSearch') {
			const { inputData } = this
			const field = key + rowName
			const inputSearch = new InputSearch({
				...td,
				field,
				inputData,
			})
			this.InputSearchs.push(inputSearch)

			return inputSearch.el
			
		}

		if (childNodeType === 'text') {

			return document.createTextNode(text)
		}

		if (childNodeType === 'select') {
			if (!selector || !selector.startsWith('#')) {
				throw new Error('childNodeType为select类型时未指定selector选项且selector必须为id选择器')
			}
			const { inputData } = this
			const field = key + rowName

			const select = new Select({
				...td,
				inputData,
				field,
				selector
			})
			this.selects.push(select)

			return select.el
		}

		if (childNodeType === 'radio') {
			if (!selector || !selector.startsWith('#')) {
				throw new Error('childNodeType为radio类型时未指定selector选项且selector必须为id选择器')
			}
			const { inputData } = this
			const field = key + rowName

			const radio = new Radio({
				...td,
				inputData,
				field,
				selector
			})
			this.radios.push(radio)

			return radio.el
		}

		if (childNodeType === 'addBtn') {
			const div = document.createElement('div')
			div.classList.add('td_add')

			div.onclick = () => {
				this.addRow({ rowName: addRowName, insertMode, scroll: true })
			}
			this.addBtnEl = div

			return div
		}

		if (childNodeType === 'delBtn') {
			const div = document.createElement('div')
			div.classList.add('td_del')

			div.onclick = () => {
				this.removeRow(rowName, trDom)
			}

			return div
		}

		if (childNodeType === 'delDisableBtn') {
			const div = document.createElement('div')
			div.classList.add('td_del_disable')

			return div
		}
	}

	$mount(selector = this.selector) {

		if (typeof selector !== 'string') {
			throw new Error('渲染失败：请检查 $mount 传参')
		}
		this.selector = selector
		const el = document.querySelector(selector)

		const { waitRanderTemplate } = this

		el.appendChild(waitRanderTemplate)

		this.randerFixedStyle()

		return this
	}

	randerFixedStyle() {
		const { waitFixedTd } = this

		waitFixedTd.forEach(td => {
			const pl = td.parentNode.offsetLeft
			const l = td.offsetLeft

			Object.assign(td.style, {
				position: 'sticky',
				left: l - pl + 'px',
				// zIndex: 10,
				backgroundColor: '#fafafa',
			})
		})
	}

	addRow({ rowName, insertMode, scroll }) {

		const trH = 60
		const scrollEl = document.querySelector('.content-table')

		const { colData, rowData } = this
		const targetRowData = rowData.find(row => row.rowName === rowName)

		const addRowData = JSON.parse(JSON.stringify(targetRowData))
		const subRowName = Math.max(...rowData.map(row => parseInt(row.rowName))) + 1
		Object.assign(addRowData, { rowName: String(subRowName) })

		rowData.push(addRowData)

		const { randerList, inputData } = this.handleData({
			rowData: [addRowData],
			colData,
			separateConfig: this.separateConfig,
		})

		Object.assign(this.inputData, inputData)

		const newWaitRanderTemplate = this.generateRanderTemplate(randerList)
		this.waitRanderTemplate = newWaitRanderTemplate

		this.responsiveness(inputData)

		if (insertMode === 'insertBefore') {
			const parentElement = this.addBtnEl.closest('tr')
			document.querySelector(this.selector).insertBefore(newWaitRanderTemplate, parentElement);
		} else {
			this.$mount()
		}

		scroll && scrollEl.scrollTo({
			left: 0,
			top: scrollEl.scrollTop + trH,
			behavior: 'smooth'
		})

		this.eventBus.$emit('changInputData')
		this.eventBus.$emit('changInputs')

		const hasAllY = Boolean(rowData.find(row => row?.formulas?.mode === 'allY'))
		hasAllY && this.eventBus.$emit('changFormula')

	}

	removeRow(rowName, trDom) {
		const { colData, rowData, inputData } = this

		const index = rowData.findIndex(row => row.rowName === rowName)

		const delKeys = colData.map(col => col.key + rowData[index].rowName)
		this.inputs = this.inputs.filter(input => !delKeys.includes(input.field))
		this.InputSearchs = this.InputSearchs.filter(input => !delKeys.includes(input.field))
		this.selects = this.selects.filter(select => !delKeys.includes(select.field))
		this.radios = this.radios.filter(radio => !delKeys.includes(radio.field))
		delKeys.forEach(key => {
			inputData[key].value = '0.00'
			delete inputData[key]
		})

		rowData.splice(index, 1)

		trDom.remove()

		this.eventBus.$emit('changInputData')
		this.eventBus.$emit('changInputs')

		const hasAllY = Boolean(rowData.find(row => row?.formulas?.mode === 'allY'))
		hasAllY && this.eventBus.$emit('changFormula')
	}

	addCol() { }

	removeCol() { }

	echoData(
		data,
		fn = (d, item) => {
			const key = item['HC'] ? 'HC' : 'EWBHXH'
			if (!key) {
				throw new Error('数据回显失败：请检查handleEchoData回调函数')
			}
			return (d['tRowName'] || d['rowName']) === item[key]
		}
	) {
		const addBtnData = Object.values(this.inputData).find(item => item.childNodeType === 'addBtn' && item.addRowName)
		if (!!addBtnData) {
			const diff = data.length - this.rowData.length
			for (let i = 0; i < diff; i++) {
				this.addRow({
					rowName: addBtnData.addRowName,
					insertMode: addBtnData.insertMode,
				})
			}
		}
		data.forEach(item => {
			const list = Object.values(this.inputData).filter(d => fn(d, item))
			list.forEach(l => {
				const {
					sendField,
					formatValue,
					formatOriginValue,
				} = l
				if (!sendField) return
				let value = item[sendField]
				let oValue = value

				value = formatValue && typeof formatValue === 'function' ? formatValue(value) : formattedMoney(+value || 0)
				oValue = formatOriginValue && typeof formatOriginValue === 'function' ? formatOriginValue(oValue) : formattedMoney(+oValue || 0)

				Object.assign(l, { value, oValue })
			})
		})
	}

	sendData(rowNamekey = 'HC') {
		const tempList = []
		const { rowData, inputData } = this

		rowData.forEach(row => {
			const { rowName, tRowName, isSend = true, additionalFields = {} } = row
			const obj = { [rowNamekey]: tRowName || rowName, ...additionalFields }
			if (!isSend) return

			Object.values(inputData).forEach(item => {
				let { rowName, tRowName, sendField, sendValue = 'value' } = item

				if (!sendField) return

				if ((tRowName || rowName) !== obj[rowNamekey]) return

				obj[sendField] = additionalFields[sendField] || replaceCommaWithDot(item[sendValue])
			})
			tempList.push(obj)
		})

		return tempList
	}
}

class UI {
	constructor(globalConfig = {}, activeComputing = false) {
		this.index = 0
		// 所有实例中inputData数据集合
		this.allData = {}
		// 所有实例集合
		this.exampleList = []
		// 全局实例配置
		this.globalConfig = globalConfig

		this.activeComputing = activeComputing

		this.dep = new Dep()
		this.eventBus = new Event()

		// 初始化事件监听
		this.initEventListeners()

		this.dependGlobalConfig()
	}

	render(rowData, colData, separateConfig = {}, activeComputing, unique = this.index++) {

		return this.handleData(rowData, colData, separateConfig, activeComputing, unique)
	}

	handleData(rowData, colData, separateConfig, activeComputing, unique) {
		// this.checkData()
		const example = new Rander({
			rowData,
			colData,
			separateConfig,
			unique,
			activeComputing: typeof activeComputing === 'undefined' ? this.activeComputing : activeComputing,
			dep: this.dep,
			eventBus: this.eventBus,
		})
		this.exampleList.push(example)

		this.setTapCursor()
		this.setAllData()

		return example
	}

	setTapCursor() {
		const allInputs = this.exampleList.map(example => example.inputs).flat()

		allInputs.forEach((input, index) => {
			input.el.onkeydown = e => {
				if (e.key !== 'Enter') return

				e.preventDefault();
				var nextInputIndex = index + 1;
				if (nextInputIndex >= allInputs.length) return
				allInputs[nextInputIndex].el.focus();
			}
		})
	}

	setAllData() {
		this.exampleList.forEach(example => {
			const { inputData } = example
			Object.assign(this.allData, inputData)
		})
	}

	initEventListeners() {
		this.eventBus.$on('changInputData', () => this.setAllData())
		this.eventBus.$on('changInputs', () => this.setTapCursor())
	}

	dependGlobalConfig() {
		const { separateConfig = {} } = this.globalConfig

		Object.keys(separateConfig).forEach(k => {
			const { formula } = separateConfig[k] || {}
			if (!formula) return
			
			const computeArr = formula
				.split(/( \+ | - | * | \/)/)
				.map(s => s.replace(',', ''))
			const fields = computeArr.filter(s => /^\[.*\]$/.test(s))

			this.depend({ computeArr, fields, k: k.replace(/[\[\],]/g, '') })
		})
	}

	depend({ computeArr, fields, k }) {
		fields.forEach(field => {
			const key = field.slice(1, -1).trim()
			const updateFns = this.dep.allUpdateFns[key] || []

			const fn = () => {
				// 提取并赋值变量
				const formula = computeArr.map(s => {
					// if (/^\{.*\}$/.test(s)) {
					// 	const variableName = s.slice(1, -1).trim()
					// 	return this.variable[variableName]
					// }
					if (/^\[.*\]$/.test(s)) {
						const key = s.slice(1, -1).trim()
						const value = this.allData[key].value
						return +replaceCommaWithDot(value)
					}
					return s
				}).join('').replace('，', ',')
				const newVal = new Function('return ' + formula)()
				const { formatValue } = this.allData[k]
				this.allData[k].value = formatValue && typeof formatValue === 'function' ? formatValue(newVal) : formattedMoney(newVal)
			}
			updateFns.push(fn)
			this.dep.depend(key, updateFns)
		})
	}
	groupEchoData(data, groupKey, fn) {
		const groupData = {}
		data.forEach(item => {
			const key = item[groupKey] || '0'
			groupData[key] = (groupData[key] || []).concat(item)
		})
		Object.keys(groupData).forEach(k => {
			const value = groupData[k]

			const targetExample = this.exampleList.find(example => example.unique === k)
			targetExample.echoData(value, fn)
		})
	}

	handleEchoData(data, fn) {
		this.groupEchoData(data, Symbol(), fn)
	}

	handleMergeEchoData(data, fn = () => true) {
		this.exampleList.forEach(example => {
			example.echoData(data, fn)
		})
	}

	handleSendData(rowNamekey = 'HC') {
		const { exampleList } = this
		const sendData = exampleList.map(example => example.sendData(rowNamekey))

		return sendData.flat()
	}

	handleMergeSendData() {
		const data = this.handleSendData()
		const sendData = {}
		data.forEach(item => {
			Object.assign(sendData, item)
		})

		return [sendData]
	}

}

[
	'formattedMoney',
	'replaceCommaWithDot',
	'Dep',
	'Event',
	'globalEvent',
	'Radio',
	'Select',
	'InputSearch',
	'Input',
	'Rander',
	'UI',
].forEach(k => {
	window[k] = window[k] || eval(k)
})
// const UIExample = new UI()
// UIExample.rander(rowData, colData).$mount('#tbody')
