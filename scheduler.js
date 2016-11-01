const utils = require('./utils');
const CronJob = require('cron').CronJob;

const spawn = require('child_process').spawn;


var scheduler = function() {
	utils.db.query('SELECT count(id) count FROM jobs WHERE status=1').then(function(rows) {
		/* make sure no process running at this time */
		if (rows[0]['count'] <= 0) {

			utils.db.query('SELECT * FROM jobs WHERE status=0 LIMIT 0, 1').then(function(rows) {
				//console.log(rows);
				
				if (rows.length<=0) {
					console.log('No Jobs to schedule');
					return;
				}

				utils.db.query('UPDATE jobs set status=1 WHERE  id='+rows[0]['id']).then(function(r){

					if (r.affectedRows > 0) {

						console.log('Scheduling a job...');
						var arguments = rows[0]['arguments'].split(',');
						var cmd = spawn(rows[0]['command'], arguments);

						cmd.stdout.on('data', (data) => {
							console.log(`stdout: ${data}`);
						});

						cmd.stderr.on('data', (data) => {
							console.log(`stderr: ${data}`);
						});

						cmd.on('close', (code) => {
							console.log(`child process exited with code ${code}`);
							utils.db.query('UPDATE jobs set status=2 WHERE  id='+rows[0]['id']);
						});
						
						//console.log('Scheduling a job...');
						//console.log(rows);

					} 

				})
			}).catch(function(e){
				console.log(e);
			})
		} else {
			console.log('A Job in progress...')
		}
	}).catch(function(e) {

	})
}

new CronJob('* * * * * *', scheduler, null, true, 'America/Los_Angeles');
