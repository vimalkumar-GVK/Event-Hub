from database.connection import get_db
db = get_db()
res = db.events.update_many({'approval_status': 'pending_approval'}, {'$set': {'approval_status': 'approved', 'status': 'published'}})
print('Updated', res.modified_count)
