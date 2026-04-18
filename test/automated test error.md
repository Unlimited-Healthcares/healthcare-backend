test (18.x)
cancelled 2 minutes ago in 1m 40s
Search logs
1s
24s
Checking docker version
Clean up resources from previous jobs
Create local container network
Starting postgres service container
Starting redis service container
Waiting for all services to be ready
1s
Run actions/checkout@v4
Syncing repository: NwaforChukwuebuka/unlimitedhealthcare
Getting Git version info
Temporarily overriding HOME='/home/runner/work/_temp/1ede04c4-f108-4f7f-bcd2-7749f8374f13' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/unlimitedhealthcare/unlimitedhealthcare
Deleting the contents of '/home/runner/work/unlimitedhealthcare/unlimitedhealthcare'
Initializing the repository
Disabling automatic garbage collection
Setting up auth
Fetching the repository
Determining the checkout info
/usr/bin/git sparse-checkout disable
/usr/bin/git config --local --unset-all extensions.worktreeConfig
Checking out the ref
/usr/bin/git log -1 --format=%H
2e36475c3e945163d8f5a180d6deefe2f6313663
2s
Run actions/setup-node@v4
Found in cache @ /opt/hostedtoolcache/node/18.20.8/x64
Environment details
/opt/hostedtoolcache/node/18.20.8/x64/bin/npm config get cache
/home/runner/.npm
Cache hit for: node-cache-Linux-x64-npm-5556f1becb27b9bf449cc56bf96f31fb2384a570e7e97e1abd828a750b040586
Received 93531414 of 93531414 (100.0%), 164.9 MBs/sec
Cache Size: ~89 MB (93531414 B)
/usr/bin/tar -xf /home/runner/work/_temp/a870f1c8-f3dc-4a4a-8c0a-5e48df56daf1/cache.tzst -P -C /home/runner/work/unlimitedhealthcare/unlimitedhealthcare --use-compress-program unzstd
Cache restored successfully
Cache restored from key: node-cache-Linux-x64-npm-5556f1becb27b9bf449cc56bf96f31fb2384a570e7e97e1abd828a750b040586
13s
Run npm ci --ignore-scripts
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported
npm warn deprecated argv@0.0.2: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
npm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
npm warn deprecated superagent@8.1.2: Please upgrade to v9.0.0+ as we have fixed a public vulnerability with formidable dependency. Note that v9.0.0+ requires Node.js v14.18.0+. See https://github.com/ladjs/superagent/pull/1800 for insight. This project is supported and maintained by the team at Forward Email @ https://forwardemail.net
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.

added 1067 packages, and audited 1068 packages in 13s

172 packages are looking for funding
  run `npm fund` for details

2 low severity vulnerabilities

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
0s
Run cp .env.example .env.test
11s
8s
Run npm run test

> unlimitedhealthcare-backend@1.0.0 test
> jest

PASS src/auth/auth.service.spec.ts (6.847 s)
  AuthService
    register
      ✓ should register a new user successfully (13 ms)
      ✓ should throw ConflictException if user already exists (17 ms)
    login
      ✓ should login user with valid credentials (4 ms)
      ✓ should throw UnauthorizedException with invalid credentials (9 ms)
      ✓ should throw UnauthorizedException when user not found (4 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        7.072 s
Ran all test suites.
36s
Run npm run test:integration
> unlimitedhealthcare-backend@1.0.0 test:integration
> jest --testPathPattern=./test/.*\.integration-spec\.ts$ --config=./test/jest-integration.json --passWithNoTests
[Nest] 2749  - 07/10/2025, 4:41:44 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (1)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
[Nest] 2749  - 07/10/2025, 4:41:47 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (2)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
[Nest] 2749  - 07/10/2025, 4:41:50 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (3)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
[Nest] 2749  - 07/10/2025, 4:41:53 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (4)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
[Nest] 2749  - 07/10/2025, 4:41:56 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (5)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
[Nest] 2749  - 07/10/2025, 4:41:59 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (6)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
[Nest] 2749  - 07/10/2025, 4:42:02 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (7)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
[Nest] 2749  - 07/10/2025, 4:42:05 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (8)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
[Nest] 2749  - 07/10/2025, 4:42:08 PM   ERROR [TypeOrmModule] Unable to connect to the database. Retrying (9)...
Error: connect ECONNREFUSED 127.0.0.1:5433
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
  console.error
    Failed to create test app: Error: connect ECONNREFUSED 127.0.0.1:5433
        at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16) {
      errno: -111,
      code: 'ECONNREFUSED',
      syscall: 'connect',
      address: '127.0.0.1',
      port: 5433
    }
      25 |     return { app, dataSource };
      26 |   } catch (error) {
    > 27 |     console.error('Failed to create test app:', error);
         |             ^
      28 |     throw error;
      29 |   }
      30 | }
      at createTestApp (test-helper.ts:27:13)
      at Object.<anonymous> (chat.integration-spec.ts:15:23)
  console.error
    Failed to initialize test app: Error: connect ECONNREFUSED 127.0.0.1:5433
        at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16) {
      errno: -111,
      code: 'ECONNREFUSED',
      syscall: 'connect',
      address: '127.0.0.1',
      port: 5433
    }
      53 |       console.log('Auth token obtained:', authToken ? 'YES' : 'NO');
      54 |     } catch (error) {
    > 55 |       console.error('Failed to initialize test app:', error);
         |               ^
      56 |       throw error;
      57 |     }
      58 |   });
      at Object.<anonymous> (chat.integration-spec.ts:55:15)
FAIL test/chat.integration-spec.ts (34.617 s)
  Chat System Integration
    Chat Rooms
      ✕ should create a chat room (2 ms)
      ✕ should get user chat rooms
    Chat Messages
      ✕ should send a message to a chat room (1 ms)
      ✕ should get messages from a chat room
  ● Chat System Integration › Chat Rooms › should create a chat room
    connect ECONNREFUSED 127.0.0.1:5433
  ● Chat System Integration › Chat Rooms › should get user chat rooms
    connect ECONNREFUSED 127.0.0.1:5433
  ● Chat System Integration › Chat Messages › should send a message to a chat room
    connect ECONNREFUSED 127.0.0.1:5433
  ● Chat System Integration › Chat Messages › should get messages from a chat room
    connect ECONNREFUSED 127.0.0.1:5433
Test Suites: 1 failed, 1 total
Tests:       4 failed, 4 total
Snapshots:   0 total
Time:        34.84 s
Ran all test suites matching /.\/test\/.*.integration-spec.ts$/i.
Error: The operation was canceled.
0s
0s
0s
0s
0s
0s
Run actions/upload-artifact@v4
Multiple search paths detected. Calculating the least common ancestor of all paths
The least common ancestor is /home/runner/work/unlimitedhealthcare/unlimitedhealthcare/backend. This will be the root directory of the artifact
Warning: No files were found with the provided path: backend/reports/
backend/coverage/
backend/test-results.xml. No artifacts will be uploaded.
0s
0s
0s
Post job cleanup.
/usr/bin/git version
git version 2.49.0
Temporarily overriding HOME='/home/runner/work/_temp/2e816810-e10b-402f-be3a-0ce09d689a23' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/unlimitedhealthcare/unlimitedhealthcare
/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
http.https://github.com/.extraheader
/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
1s
Print service container logs: b53da9f294834737ba782fe2f3e68a8d_postgres13_12cf06
/usr/bin/docker logs --details 360b99c521cd7892e576d19738328bc2235ab2d82936ed08ed4f9610bb62cfa1
 The files belonging to this database system will be owned by user "postgres".
 initdb: warning: enabling "trust" authentication for local connections
 This user must also own the server process.
 You can change this by editing pg_hba.conf or using the option -A, or
 --auth-local and --auth-host, the next time you run initdb.
 
 The database cluster will be initialized with locale "en_US.utf8".
 The default database encoding has accordingly been set to "UTF8".
 The default text search configuration will be set to "english".
 
 Data page checksums are disabled.
 
 fixing permissions on existing directory /var/lib/postgresql/data ... ok
 creating subdirectories ... ok
 selecting dynamic shared memory implementation ... posix
 selecting default max_connections ... 100
 selecting default shared_buffers ... 128MB
 selecting default time zone ... Etc/UTC
 creating configuration files ... ok
 running bootstrap script ... ok
 performing post-bootstrap initialization ... ok
 syncing data to disk ... ok
 
 
 Success. You can now start the database server using:
 
     pg_ctl -D /var/lib/postgresql/data -l logfile start
 
 waiting for server to start....2025-07-10 16:40:45.798 UTC [47] LOG:  starting PostgreSQL 13.21 (Debian 13.21-1.pgdg120+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
 2025-07-10 16:40:46.167 UTC [1] LOG:  starting PostgreSQL 13.21 (Debian 13.21-1.pgdg120+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
 2025-07-10 16:40:46.167 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
 2025-07-10 16:40:46.167 UTC [1] LOG:  listening on IPv6 address "::", port 5432
 2025-07-10 16:40:46.168 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
 2025-07-10 16:40:46.171 UTC [62] LOG:  database system was shut down at 2025-07-10 16:40:46 UTC
 2025-07-10 16:40:46.187 UTC [1] LOG:  database system is ready to accept connections
 2025-07-10 16:40:54.942 UTC [76] FATAL:  role "root" does not exist
 2025-07-10 16:41:05.057 UTC [84] FATAL:  role "root" does not exist
 2025-07-10 16:41:15.177 UTC [92] FATAL:  role "root" does not exist
 2025-07-10 16:41:25.347 UTC [100] FATAL:  role "root" does not exist
 2025-07-10 16:41:35.486 UTC [107] FATAL:  role "root" does not exist
 2025-07-10 16:41:45.555 UTC [115] FATAL:  role "root" does not exist
 2025-07-10 16:41:55.630 UTC [124] FATAL:  role "root" does not exist
 2025-07-10 16:42:05.696 UTC [132] FATAL:  role "root" does not exist
 2025-07-10 16:40:45.799 UTC [47] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
 2025-07-10 16:40:45.802 UTC [48] LOG:  database system was shut down at 2025-07-10 16:40:45 UTC
 2025-07-10 16:40:45.811 UTC [47] LOG:  database system is ready to accept connections
  done
 server started
 CREATE DATABASE
 
 
 /usr/local/bin/docker-entrypoint.sh: ignoring /docker-entrypoint-initdb.d/*
 
 waiting for server to shut down...2025-07-10 16:40:46.033 UTC [47] LOG:  received fast shutdown request
 .2025-07-10 16:40:46.033 UTC [47] LOG:  aborting any active transactions
 2025-07-10 16:40:46.039 UTC [47] LOG:  background worker "logical replication launcher" (PID 54) exited with exit code 1
 2025-07-10 16:40:46.040 UTC [49] LOG:  shutting down
 2025-07-10 16:40:46.052 UTC [47] LOG:  database system is shut down
  done
 server stopped
 
 PostgreSQL init process complete; ready for start up.
 
Stop and remove container: b53da9f294834737ba782fe2f3e68a8d_postgres13_12cf06
/usr/bin/docker rm --force 360b99c521cd7892e576d19738328bc2235ab2d82936ed08ed4f9610bb62cfa1
360b99c521cd7892e576d19738328bc2235ab2d82936ed08ed4f9610bb62cfa1
Print service container logs: 40984ba7eeb9430da72024b32113613a_redis6_df39a9
/usr/bin/docker logs --details 2fb98941ac880377972cde0e710a37f788ea4bdea7e22a3f28f7a4700e655384
 1:C 10 Jul 2025 16:40:46.212 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
 1:C 10 Jul 2025 16:40:46.212 # Redis version=6.2.19, bits=64, commit=00000000, modified=0, pid=1, just started
 1:C 10 Jul 2025 16:40:46.212 # Warning: no config file specified, using the default config. In order to specify a config file use redis-server /path/to/redis.conf
 1:M 10 Jul 2025 16:40:46.213 * monotonic clock: POSIX clock_gettime
 1:M 10 Jul 2025 16:40:46.213 * Running mode=standalone, port=6379.
 1:M 10 Jul 2025 16:40:46.213 # Server initialized
 1:M 10 Jul 2025 16:40:46.213 # WARNING Memory overcommit must be enabled! Without it, a background save or replication may fail under low memory condition. Being disabled, it can can also cause failures without low memory condition, see https://github.com/jemalloc/jemalloc/issues/1328. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.
 1:M 10 Jul 2025 16:40:46.213 * Ready to accept connections
Stop and remove container: 40984ba7eeb9430da72024b32113613a_redis6_df39a9
/usr/bin/docker rm --force 2fb98941ac880377972cde0e710a37f788ea4bdea7e22a3f28f7a4700e655384
2fb98941ac880377972cde0e710a37f788ea4bdea7e22a3f28f7a4700e655384
Remove container network: github_network_7f92a30cc4ba414fa02e24a26aa70ecb
/usr/bin/docker network rm github_network_7f92a30cc4ba414fa02e24a26aa70ecb
github_network_7f92a30cc4ba414fa02e24a26aa70ecb