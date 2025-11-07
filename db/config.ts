import { column, defineTable, defineDb } from "astro:db"

const ClickupTask = defineTable({
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

const Bucket = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text(),
		slug: column.text({ unique: true }),
		order: column.number(),
	},
})

const Objective = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		bucketId: column.number({ references: () => Bucket.columns.id }),
		name: column.text(),
		slug: column.text({ unique: true }),
		startDate: column.date({ optional: true }),
		dueDate: column.date({ optional: true }),
		status: column.text({
			enum: [
				"notstarted",
				"archived",
				"inprogress",
				"onhold",
				"completed",
			],
			default: "notstarted",
		}),
	},
})

const Block = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		name: column.text(),
		objectiveId: column.number({ references: () => Objective.columns.id }),
		year: column.number(),
		weekNumber: column.number(),
		status: column.text({
			enum: [
				"notstarted",
				"archived",
				"inprogress",
				"onhold",
				"completed",
			],
			default: "notstarted",
		}),
		scheduledTime: column.number({ default: 0 }), // in minutes
	},
	// foreignKeys: [
	// 	// {
	// 	// 	columns: ["year", "weekNumber"],
	// 	// 	references: () => [Week.columns.year, Week.columns.weekNumber],
	// 	// },
	// 	{
	// 		columns: ["year", "weekNumber", "objectiveId"],
	// 		references: () => [
	// 			TimePerWeek.columns.year,
	// 			TimePerWeek.columns.weekNumber,
	// 			TimePerWeek.columns.objectiveId,
	// 		],
	// 	},
	// ],
})

const Week = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		year: column.number(),
		weekNumber: column.number(),
	},
	indexes: [{ on: ["year", "weekNumber"], unique: true }],
})

const TimePerWeek = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		year: column.number(),
		weekNumber: column.number(),
		itemType: column.text({
			enum: ["bucket", "objective"],
			default: "objective",
		}),
		objectiveId: column.number({ references: () => Objective.columns.id }),
		scheduledTime: column.number({ default: 0 }), // in minutes
	},
	foreignKeys: [
		{
			columns: ["year", "weekNumber"],
			references: () => [Week.columns.year, Week.columns.weekNumber],
		},
	],
	indexes: [
		{ on: ["year", "weekNumber", "itemType", "objectiveId"], unique: true },
	],
})

const Session = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		itemType: column.text({
			enum: ["bucket", "objective"],
			default: "objective",
		}),
		objectiveId: column.number({ references: () => Objective.columns.id }),
		startTime: column.date(),
		endTime: column.date({ optional: true }),
		notes: column.text({ optional: true }),
	},
})

const KeyValue = defineTable({
	columns: {
		key: column.text({ primaryKey: true }),
		value: column.text(),
	},
})

export default defineDb({
	tables: {
		ClickupTask,
		Bucket,
		Objective,
		Block,
		Week,
		TimePerWeek,
		Session,
		KeyValue,
	},
})
