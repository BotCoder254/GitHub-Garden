const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const boxen = require('boxen');
const gradient = require('gradient-string');
const cliProgress = require('cli-progress');
const figlet = require('figlet');
const chalkAnimation = require('chalk-animation');
const { createSpinner } = require('nanospinner');
require('dotenv').config();

// Display ASCII art logo
function displayLogo() {
    console.clear();
    const logo = figlet.textSync('GitHub Garden', {
        font: 'ANSI Shadow',
        horizontalLayout: 'full'
    });
    console.log(gradient.pastel.multiline(logo));
    console.log('\n' + gradient.cristal.multiline('Coded with by TELVIN TEUM') + '\n');
}

// Clean up function
async function cleanupFolders() {
    const spinner = createSpinner('Cleaning up old contribution folders...').start();
    try {
        // Find and remove all contribution repo folders
        const files = fs.readdirSync(process.cwd());
        const repoFolders = files.filter(f => f.startsWith('contribution-repo-'));
        
        for (const folder of repoFolders) {
            const folderPath = path.join(process.cwd(), folder);
            fs.rmSync(folderPath, { recursive: true, force: true });
        }
        
        spinner.success({ text: ' Cleaned up old contribution folders' });
    } catch (error) {
        spinner.error({ text: ' Failed to clean up folders' });
        throw error;
    }
}

// Configuration
const CONFIG = {
    // GitHub configuration
    githubUsername: process.env.GITHUB_USERNAME || 'BotCoder254',
    githubEmail: process.env.GITHUB_EMAIL || 'teumteum776@gmail.com',
    githubToken: process.env.GITHUB_TOKEN || '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',
    
    // Repository settings
    repoName: 'contribution-garden',
    repoPath: path.join(process.cwd(), `contribution-repo-${Date.now()}`),
    fileName: 'contribution.txt',
    
    // Contribution settings
    minCommitsPerDay: 18,
    maxCommitsPerDay: 50,
    authenticatedUser: null,
    startDate: null,
    gapDays: null,
    yearRange: { start: 0, end: 11 }, // January (0) to December (11)
    
    // Timing settings
    commitDelay: 2000,     // Delay between commits (2 seconds)
    batchSize: 5,          // Number of days to process before checking for gaps again
    batchDelay: 10000,     // Delay between batches (10 seconds)
    
    // Progress tracking
    totalContributions: 0,
    completedContributions: 0,
    
    // Render deployment settings
    autoRunInterval: 2 * 24 * 60 * 60 * 1000, // Run every 2 days (in milliseconds)
    isRenderDeployment: process.env.RENDER === 'true' || false
};

// Sleep function for visual delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Display animated title
async function displayTitle() {
    return new Promise((resolve) => {
        figlet('GitGrow', {
            font: 'Ghost',
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 100,
            whitespaceBreak: true
        }, function(err, data) {
            if (err) {
                console.log('Something went wrong...');
                resolve();
                return;
            }
            const rainbow = chalkAnimation.rainbow(data);
            setTimeout(() => {
                rainbow.stop();
                resolve();
            }, 2000);
        });
    });
}

// Clean up directory
async function cleanupDirectory(path) {
    const spinner = createSpinner('Cleaning up directory...').start();
    
    try {
        if (fs.existsSync(path)) {
            // Try to remove Git lock files first
            const gitLockFile = `${path}/.git/index.lock`;
            if (fs.existsSync(gitLockFile)) {
                try {
                    fs.unlinkSync(gitLockFile);
                } catch (e) {
                    // Ignore error if we can't remove lock file
                }
            }
            
            // Try multiple times with delay
            for (let i = 0; i < 3; i++) {
                try {
                    fs.rmSync(path, { recursive: true, force: true });
                    break;
                } catch (error) {
                    if (i === 2) throw error;
                    spinner.update({ text: `Directory busy, attempt ${i + 1}/3...` });
                    await sleep(2000);
                }
            }
        }
        spinner.success({ text: ' Directory cleaned' });
    } catch (error) {
        spinner.error({ text: ' Failed to clean directory' });
        throw error;
    }
}

// Initialize repository with animation
async function initializeRepo() {
    const spinner = createSpinner('Preparing your garden...').start();
    
    try {
        // Clean up existing directory
        await cleanupDirectory(CONFIG.repoPath);
        
        // Create fresh directory
        fs.mkdirSync(CONFIG.repoPath, { recursive: true });
        
        // Initialize Git repository
        const repoUrl = `https://${CONFIG.githubToken}@github.com/${CONFIG.githubUsername}/${CONFIG.repoName}.git`;
        
        try {
            spinner.update({ text: 'Creating GitHub repository...' });
            const response = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${CONFIG.githubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: CONFIG.repoName,
                    private: false,
                    auto_init: false,
                    description: ' My contribution garden, created with GitGrow'
                })
            });
            
            if (!response.ok && response.status !== 422) { // 422 means repo exists
                throw new Error(`Failed to create repository: ${response.statusText}`);
            }
        } catch (error) {
            if (!error.message.includes('422')) {
                throw error;
            }
            // Repository already exists, which is fine
        }
        
        // Configure git credentials
        execSync(`git config --global user.name "${CONFIG.githubUsername}"`);
        execSync(`git config --global user.email "${CONFIG.githubEmail}"`);
        spinner.update({ text: 'Configuring Git credentials...' });
        await sleep(500);
        
        // Create remote repository if it doesn't exist
        spinner.update({ text: 'Setting up GitHub repository...' });
        
        try {
            // Try to create the repository first
            const createRepoCommand = `curl -X POST -H "Authorization: token ${CONFIG.githubToken}" -H "Content-Type: application/json" https://api.github.com/user/repos -d "{\\"name\\":\\"${CONFIG.repoName}\\",\\"private\\":false}"`;
            execSync(createRepoCommand, { stdio: 'pipe' });
            spinner.update({ text: 'Created new repository on GitHub' });
        } catch (error) {
            // If repository already exists, that's fine
            spinner.update({ text: 'Repository already exists, continuing...' });
        }
        
        await sleep(2000); // Wait for GitHub to process the repository creation
        
        try {
            // Configure the repository
            process.chdir(CONFIG.repoPath);
            execSync('git init', { stdio: 'pipe' });
            
            // Remove any existing remote
            try {
                execSync('git remote remove origin', { stdio: 'pipe' });
            } catch (e) {
                // Ignore error if remote doesn't exist
            }
            
            execSync(`git remote add origin ${repoUrl}`, { stdio: 'pipe' });
            
            // Create initial file
            fs.writeFileSync(CONFIG.fileName, ' Welcome to my contribution garden! \n');
            
            execSync('git add .', { stdio: 'pipe' });
            execSync('git commit -m " Initial commit"', { stdio: 'pipe' });
            execSync('git branch -M main', { stdio: 'pipe' });
            
            // Try pushing multiple times with delay
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    spinner.update({ text: `Pushing to GitHub (attempt ${attempt}/3)...` });
                    execSync('git push -u origin main --force', { stdio: 'pipe' });
                    break;
                } catch (pushError) {
                    if (attempt === 3) throw pushError;
                    await sleep(2000);
                }
            }
            
            spinner.success({ text: ' Garden prepared successfully!' });
            await sleep(1000);
        } catch (error) {
            spinner.error({ text: ' Failed to prepare garden' });
            throw error;
        }
    } catch (error) {
        spinner.error({ text: ' Failed to prepare garden' });
        throw error;
    }
}

// Fetch user's contribution data
async function fetchContributionData(username, spinner = null) {
    const localSpinner = spinner || createSpinner('Analyzing your contribution history...').start();
    try {
        // GraphQL query to get contribution calendar
        const query = `
        query {
            user(login: "${username}") {
                contributionsCollection {
                    contributionCalendar {
                        totalContributions
                        weeks {
                            contributionDays {
                                contributionCount
                                date
                            }
                        }
                    }
                }
            }
        }`;

        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${CONFIG.githubToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (!data.data?.user?.contributionsCollection?.contributionCalendar) {
            throw new Error('Could not fetch contribution data');
        }

        const calendar = data.data.user.contributionsCollection.contributionCalendar;
        const days = calendar.weeks.flatMap(week => week.contributionDays);
        
        // Find days with no contributions
        const gapDays = days.filter(day => day.contributionCount === 0)
                           .map(day => new Date(day.date))
                           .sort((a, b) => a - b); // Sort by date

        if (spinner) {
            localSpinner.success({ text: ` Found ${gapDays.length} days without contributions` });
        }
        return gapDays;
    } catch (error) {
        localSpinner.error({ text: ' Failed to fetch contribution data' });
        throw error;
    }
}

// Validate configuration with animation
async function validateConfig() {
    const spinner = createSpinner('Validating your gardening tools...').start();
    
    try {
        // Validate required environment variables
        if (!CONFIG.githubToken) {
            throw new Error('GitHub token is missing. Please check your .env file.');
        }
        if (!CONFIG.githubUsername) {
            throw new Error('GitHub username is missing. Please check your .env file.');
        }
        if (!CONFIG.githubEmail) {
            throw new Error('GitHub email is missing. Please check your .env file.');
        }

        // Test GitHub authentication
        const authSpinner = createSpinner('Testing GitHub authentication...').start();
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${CONFIG.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
            }
            
            const userData = await response.json();
            authSpinner.success({ 
                text: ` Authenticated as ${userData.login} (${userData.name || 'No Name'})
   Account created: ${new Date(userData.created_at).toDateString()}
   Public repos: ${userData.public_repos}
   Followers: ${userData.followers}
   Following: ${userData.following}`
            });

            // Find gaps in contributions
            const gapDays = await fetchContributionData(userData.login);
            CONFIG.gapDays = gapDays;
            CONFIG.startDate = gapDays.length > 0 ? 
                gapDays[0] : // Start from first gap if there are gaps
                new Date(userData.created_at); // Otherwise start from account creation

            CONFIG.authenticatedUser = userData;
        } catch (error) {
            authSpinner.error({ text: ` GitHub authentication failed: ${error.message}` });
            throw error;
        }

        spinner.success({ text: ' All systems ready!' });
        await sleep(1000);
        return true;
    } catch (error) {
        spinner.error({ text: ' Configuration validation failed!' });
        console.error('\n Error:', error.message);
        console.error('\n Please check:');
        console.error('  1. Your GitHub token is valid and not expired');
        console.error('  2. The token has the required permissions (repo, workflow)');
        console.error('  3. Your .env file contains all required variables');
        console.error('\n Tip: You can generate a new token at https://github.com/settings/tokens\n');
        process.exit(1);
    }
}

// Calculate commit count based on day of week and historical data
function getCommitCount(date) {
    const day = date.getDay();
    const now = new Date();
    const isHistorical = date < now;
    
    // Base commit count
    let minCommits = CONFIG.minCommitsPerDay;
    let maxCommits = CONFIG.maxCommitsPerDay;
    
    // Adjust for weekends
    if (day === 0 || day === 6) {  // Weekend
        minCommits = Math.max(1, Math.floor(minCommits * 0.5));
        maxCommits = Math.floor(maxCommits * 0.7);
    }
    
    // Historical commits should be more varied
    if (isHistorical) {
        // Add more randomness to historical commits
        const variance = Math.random();
        if (variance < 0.3) {  // 30% chance of no commits
            return 0;
        } else if (variance < 0.7) {  // 40% chance of fewer commits
            maxCommits = Math.floor(maxCommits * 0.5);
        }
    }
    
    return Math.floor(Math.random() * (maxCommits - minCommits + 1)) + minCommits;
}

// Make commits for a specific date
async function makeCommits(date, count) {
    try {
        const dateStr = date.toDateString();
        const spinner = createSpinner(`Making ${count} commits for ${dateStr}`).start();
        
        for (let i = 0; i < count; i++) {
            const commitDate = new Date(date);
            commitDate.setHours(Math.floor(Math.random() * 24));
            commitDate.setMinutes(Math.floor(Math.random() * 60));
            commitDate.setSeconds(Math.floor(Math.random() * 60));
            
            // Update the file with more varied messages
            const messages = [
                ' Growing stronger',
                ' Adding new features',
                ' Fixing bugs',
                ' Improving documentation',
                ' Code cleanup',
                ' Performance optimization'
            ];
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            fs.appendFileSync(CONFIG.fileName, `${message} on ${commitDate.toISOString()}\n`);
            execSync('git add .', { stdio: 'pipe' });
            
            // Set environment variables for the commit date
            const env = {
                ...process.env,
                GIT_AUTHOR_DATE: commitDate.toISOString(),
                GIT_COMMITTER_DATE: commitDate.toISOString()
            };
            
            execSync(`git commit -m "${message}"`, { 
                stdio: 'pipe',
                env: env
            });
            
            spinner.update({ text: `Made commit ${i + 1}/${count} for ${dateStr}` });
        }
        
        // Push commits in batches
        spinner.update({ text: `Pushing ${count} commits for ${dateStr}...` });
        execSync('git push origin main --force', { stdio: 'pipe' });
        spinner.success({ text: ` Completed ${count} commits for ${dateStr}` });
    } catch (error) {
        throw new Error(`Failed to make commits: ${error.message}`);
    }
}

// Process a batch of days
async function processBatch(days, startIndex, batchSize, progressBar) {
    const endIndex = Math.min(startIndex + batchSize, days.length);
    const batchDays = days.slice(startIndex, endIndex);
    
    for (const date of batchDays) {
        const commitCount = getCommitCount(date);
        if (commitCount > 0) {
            await makeCommits(date, commitCount);
            await sleep(CONFIG.commitDelay); // Wait between commits
        }
        progressBar.increment();
    }
    
    // Check if we need to verify the contributions
    if (endIndex < days.length) {
        const verifySpinner = createSpinner('Verifying contributions and checking for gaps...').start();
        await sleep(CONFIG.batchDelay); // Wait before checking
        
        // Fetch latest contribution data
        const remainingGaps = await fetchContributionData(CONFIG.githubUsername, verifySpinner);
        
        // Filter out days that we've already processed
        const newGaps = remainingGaps.filter(gap => 
            gap > days[endIndex - 1] && gap <= days[days.length - 1]
        );
        
        if (newGaps.length === 0) {
            verifySpinner.success({ text: ' All contributions verified!' });
            return true; // Signal that we're done
        }
        
        verifySpinner.info({ text: ` Found ${newGaps.length} remaining gaps to fill` });
    }
    
    return false; // Continue processing
}

// Generate contributions
async function generateContributions() {
    try {
        const now = new Date();
        let daysToProcess = [];

        if (CONFIG.gapDays && CONFIG.gapDays.length > 0) {
            // Process only gap days
            daysToProcess = CONFIG.gapDays.filter(date => {
                // Filter days to only include those in the specified month range (Jan-Dec)
                const month = date.getMonth();
                return date <= now && month >= CONFIG.yearRange.start && month <= CONFIG.yearRange.end;
            });
            if (daysToProcess.length === 0) {
                console.log('\n No gaps found in your contribution history for the specified months!');
                return;
            }
            console.log(`\n Found ${daysToProcess.length} days without contributions in the specified months`);
        } else {
            // Process all days from account creation
            const totalDays = Math.ceil((now - CONFIG.startDate) / (1000 * 60 * 60 * 24));
            for (let i = 0; i < totalDays; i++) {
                const date = new Date(CONFIG.startDate);
                date.setDate(date.getDate() + i);
                // Only include days in the specified month range (Jan-Dec)
                const month = date.getMonth();
                if (date <= now && month >= CONFIG.yearRange.start && month <= CONFIG.yearRange.end) {
                    daysToProcess.push(date);
                }
            }
            console.log(`\n Processing all days since account creation for the specified months`);
        }

        console.log(`\n Date range: ${CONFIG.startDate.toDateString()} to ${now.toDateString()}`);
        console.log(`\n Total days to process: ${daysToProcess.length}`);
        
        const multibar = new cliProgress.MultiBar({
            format: ' {bar} | {percentage}% | {value}/{total} days',
            hideCursor: true,
            clearOnComplete: false
        }, cliProgress.Presets.shades_classic);
        
        const progressBar = multibar.create(daysToProcess.length, 0);
        
        // Process in batches
        for (let i = 0; i < daysToProcess.length; i += CONFIG.batchSize) {
            const done = await processBatch(daysToProcess, i, CONFIG.batchSize, progressBar);
            if (done) {
                console.log('\n All gaps have been filled successfully!');
                break;
            }
        }
        
        multibar.stop();
        
        // Final verification
        const finalSpinner = createSpinner('Performing final verification...').start();
        await sleep(CONFIG.batchDelay);
        const finalGaps = await fetchContributionData(CONFIG.githubUsername, finalSpinner);
        
        if (finalGaps.length === 0) {
            console.log('\n Your GitHub garden has been fully cultivated!');
            console.log(`\n Successfully processed all contributions from ${CONFIG.startDate.toDateString()} to ${now.toDateString()}`);
            console.log(' Your contribution graph is now complete and green!');
        } else {
            console.log('\n Some contributions may need additional processing.');
            console.log(` ${finalGaps.length} days still show as gaps.`);
            console.log(' Consider running the script again to fill these remaining gaps.');
        }
        
    } catch (error) {
        console.error(' Error generating contributions:', error.message);
        process.exit(1);
    }
}

// Main execution function
async function main() {
    try {
        // Check if running in Render deployment
        if (CONFIG.isRenderDeployment) {
            console.log('Running in Render deployment mode');
        } else {
            // Display logo only in interactive mode
            displayLogo();
            
            // Show welcome message
            console.log(chalk.cyan('\n🌱 Welcome to GitHub Garden! Let\'s make your contribution graph beautiful.\n'));
        }
        
        // Initial cleanup
        await cleanupFolders();
        
        // Start progress bar (only in interactive mode)
        const mainProgress = CONFIG.isRenderDeployment ? null : new cliProgress.SingleBar({
            format: chalk.cyan('Overall Progress |{bar}| {percentage}% || {value}/{total} checks completed'),
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true
        });
        
        // Initialize progress (5 main steps)
        if (mainProgress) mainProgress.start(5, 0);
        
        // Step 1: Validate configuration
        try {
            await validateConfig();
            if (mainProgress) mainProgress.increment();
        } catch (error) {
            if (mainProgress) mainProgress.stop();
            console.error(chalk.red('\n🚫 Configuration Error:'));
            console.error(chalk.yellow(error.message));
            
            if (error.message.includes('token')) {
                console.error(chalk.cyan('\n📝 To fix this:'));
                console.error('1. Go to ' + chalk.green('https://github.com/settings/tokens'));
                console.error('2. Click "Generate new token (classic)"');
                console.error('3. Name it "GitHub Garden"');
                console.error('4. Select these scopes:');
                console.error('   - ' + chalk.green('repo') + ' (all repo access)');
                console.error('   - ' + chalk.green('workflow'));
                console.error('   - ' + chalk.green('user'));
                console.error('5. Click "Generate token"');
                console.error('6. Copy the new token');
                console.error('7. Update your ' + chalk.yellow('.env') + ' file with the new token');
            }
            process.exit(1);
        }
        
        // Step 2: Initialize repository
        try {
            await initializeRepo();
            if (mainProgress) mainProgress.increment();
        } catch (error) {
            if (mainProgress) mainProgress.stop();
            console.error(chalk.red('\n🚫 Repository Error:'));
            console.error(chalk.yellow(error.message));
            process.exit(1);
        }
        
        // Step 3: Generate contributions
        try {
            await generateContributions();
            if (mainProgress) mainProgress.increment();
        } catch (error) {
            if (mainProgress) mainProgress.stop();
            console.error(chalk.red('\n🚫 Contribution Error:'));
            console.error(chalk.yellow(error.message));
            process.exit(1);
        }
        
        // Step 4: Final verification
        try {
            const verifySpinner = CONFIG.isRenderDeployment ? null : createSpinner('Performing final contribution verification...').start();
            await sleep(CONFIG.batchDelay);
            const finalGaps = await fetchContributionData(CONFIG.githubUsername, verifySpinner);
            if (mainProgress) mainProgress.increment();
            
            // Step 5: Cleanup
            await cleanupFolders();
            if (mainProgress) mainProgress.increment();
            if (mainProgress) mainProgress.stop();
            
            // Final status with fancy formatting
            if (finalGaps.length === 0) {
                console.log('\n' + gradient.rainbow('🎉 Mission Accomplished! 🎉'));
                console.log(chalk.green('\n✨ Your GitHub contribution garden is now complete!'));
                console.log(chalk.cyan(`📊 Total Contributions: ${CONFIG.totalContributions}`));
                console.log(chalk.yellow(`📅 Contribution Period: ${CONFIG.startDate.toDateString()} to ${new Date().toDateString()}`));
                console.log(chalk.magenta('\n💫 Your profile is now more colorful than ever!'));
            } else {
                console.log('\n' + chalk.yellow('⚠️ Almost there!'));
                console.log(chalk.yellow(`📊 ${finalGaps.length} days still need attention`));
                console.log(chalk.cyan('🔄 Run the script again to fill the remaining gaps'));
            }
        } catch (error) {
            mainProgress.stop();
            console.error(chalk.red('\n🚫 Verification Error:'));
            console.error(chalk.yellow(error.message));
            process.exit(1);
        }
        
        // Display credits
        console.log('\n' + gradient.cristal.multiline('Coded with 💚 by TELVIN TEUM') + '\n');
        
    } catch (error) {
        console.error(chalk.red('\n🚫 Error:'), error.message);
        process.exit(1);
    }
}

// Function to schedule automatic runs
function scheduleAutomaticRuns() {
    if (CONFIG.isRenderDeployment) {
        console.log(`Scheduled to run automatically every ${CONFIG.autoRunInterval / (24 * 60 * 60 * 1000)} days`);
        setInterval(() => {
            console.log('\n===== Automatic run triggered =====');
            console.log(`Time: ${new Date().toISOString()}`);
            main();
        }, CONFIG.autoRunInterval);
    }
}

// Execute the script
main();

// If in Render deployment, set up automatic runs
if (CONFIG.isRenderDeployment) {
    scheduleAutomaticRuns();
}