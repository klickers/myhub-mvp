import { column, defineTable, defineDb } from "astro:db"

const Task = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		clickupId: column.text({ unique: true, optional: true }),
		name: column.text(),
		status: column.text({ enum: ["unstarted", "", ""] }),
		startDate: column.date({ optional: true }),
		dueDate: column.date({ optional: true }),
		timeEstimate: column.number({ default: 0 }),
	},
	//indexes: [{ on: ["clickupId"], unique: true }],
})


export default defineDb({
	tables: {
		Task,
	},
})
