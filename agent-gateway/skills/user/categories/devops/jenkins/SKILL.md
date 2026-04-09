---
name: jenkins
description: Jenkins automation server for continuous integration, continuous delivery, and automation workflows
license: MIT
compatibility:
  - jenkins
  - jenkins-x
  - blueocean
audience: DevOps engineers, CI/CD specialists, build engineers
category: devops
---

# Jenkins

## What I Do

I provide expertise in Jenkins - the widely-used open-source automation server that enables building, testing, deploying, and automating software delivery pipelines. I cover pipeline as code, distributed builds with agents, plugin ecosystem management, integration with cloud services, and advanced automation patterns. Jenkins provides flexible automation for any technology stack and deployment target.

## When to Use Me

- Building comprehensive CI/CD pipelines for application delivery
- Orchestrating complex multi-stage build and deployment workflows
- Managing distributed build infrastructure with Jenkins agents
- Integrating with version control, artifact repositories, and cloud platforms
- Automating testing, security scanning, and code quality gates
- Implementing blue-green or canary deployment strategies
- Building container images and deploying to Kubernetes
- Managing infrastructure as code with Terraform and Ansible
- Setting up automated code reviews and merge request pipelines

## Core Concepts

- **Jenkins Pipeline**: Workflow definitions as code using declarative or scripted syntax
- **Jenkinsfile**: Version-controlled pipeline definitions alongside application code
- **Distributed Builds**: Master-agent architecture for scaling build capacity
- **Blue Ocean**: Modern UI for visualizing and managing pipelines
- **Shared Libraries**: Reusable pipeline components across multiple projects
- **Stages and Steps**: Pipeline structure with sequential and parallel execution
- **Agent Nodes**: Build executors running on dedicated infrastructure
- **Build Triggers**: Automated pipeline execution based on events or schedules
- **Artifact Management**: Storing and versioning build outputs
- **Plugin Ecosystem**: Extending Jenkins capabilities with community plugins
- **Credentials Management**: Secure storage for API keys, passwords, and certificates
- **Parameterization**: Dynamic inputs controlling pipeline execution
- **Environment Variables**: Configuration and context for pipeline steps
- **Declarative vs Scripted**: Two pipeline syntaxes with different use cases
- **Post Actions**: Cleanup, notifications, and actions after pipeline completion

## Code Examples

### Declarative Pipeline with Stages

```groovy
pipeline {
    agent {
        docker {
            image 'maven:3.9-eclipse-temurin-17'
            args '-v $HOME/.m2:/root/.m2'
        }
    }
    
    environment {
        APP_NAME = 'order-service'
        APP_VERSION = '1.0.0'
        DOCKER_REGISTRY = 'registry.example.com'
        SONAR_URL = 'sonar.example.com'
        ARTIFACTORY_URL = 'artifactory.example.com'
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    currentBuild.displayName = "${APP_VERSION}-${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Initialize') {
            steps {
                sh 'mvn clean compile -DskipTests -q'
                sh 'mvn dependency:tree -q'
                stash name: 'source', includes: '**/*.java'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    agent any
                    steps {
                        unstash 'source'
                        sh 'mvn test -Dsurefire.failIfNoSpecifiedTests=false'
                        junit '**/target/surefire-reports/*.xml'
                    }
                    post {
                        always {
                            coverage qualityGates: [[threshold: 50, metric: 'LINE']], sourceEncoding: 'UTF-8'
                        }
                    }
                }
                stage('Integration Tests') {
                    agent {
                        docker {
                            image 'postgres:15-alpine'
                            reuseNode true
                        }
                    }
                    environment {
                        DATABASE_URL = 'jdbc:postgresql://localhost:5432/testdb'
                        DB_PASSWORD = credentials('test-db-password')
                    }
                    steps {
                        sh 'mvn verify -Pintegration-test'
                        junit '**/target/failsafe-reports/*.xml'
                    }
                }
            }
        }
        
        stage('Static Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar \
                        -Dsonar.projectKey=${APP_NAME} \
                        -Dsonar.java.binaries=. \
                        -Dsonar.coverage.jacoco.xmlReportPaths=**/target/site/jacoco/jacoco.xml'
                }
            }
            post {
                always {
                    recordIssues(
                        tools: [java(), javaDoc(), spotBugs()],
                        qualityGates: [[threshold: 1, type: 'NEW', defaultEncoding: 'UTF-8']]
                    )
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn package -DskipTests -q'
                stash name: 'artifact', includes: '**/target/*.jar'
            }
        }
        
        stage('Security Scan') {
            agent { label 'security' }
            steps {
                unstash 'artifact'
                dependencyCheck additionalArguments: '''
                    -o ./reports/
                    -f HTML
                    --suppression ./security/suppressions.xml
                ''', odcInstallation: 'dependency-check'
                dependencyCheckPublisher pattern: '**/*dependency-check-report.xml'
                openVASParse pattern: '**/*openvas-report.xml'
            }
        }
        
        stage('Docker Build') {
            steps {
                unstash 'artifact'
                script {
                    dockerImage = docker.build("${DOCKER_REGISTRY}/${APP_NAME}:${APP_VERSION}", '.')
                }
            }
        }
        
        stage('Push Image') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        dockerImage.push("${APP_VERSION}")
                        dockerImage.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when { branch 'main' }
            steps {
                kubernetesDeploy(
                    kubeconfigId: 'kubeconfig-staging',
                    configs: 'k8s/staging/*.yaml',
                    enableConfigSubstitution: true
                )
                input message: 'Deploy to Production?', ok: 'Deploy'
            }
        }
        
        stage('Deploy to Production') {
            when { branch 'main' }
            steps {
                script {
                    kubernetesDeploy(
                        kubeconfigId: 'kubeconfig-production',
                        configs: 'k8s/production/*.yaml',
                        enableConfigSubstitution: true
                    )
                    deployAndVerify(
                        environment: 'production',
                        serviceName: "${APP_NAME}",
                        imageTag: "${APP_VERSION}"
                    )
                }
            }
        }
    }
    
    post {
        success {
            archiveArtifacts artifacts: '**/target/*.jar', fingerprint: true
            emailext(
                subject: "Build Success: ${currentBuild.fullDisplayName}",
                body: "Build completed successfully",
                recipientProviders: [[$class: 'RequesterRecipientProvider']]
            )
        }
        failure {
            emailext(
                subject: "Build Failed: ${currentBuild.fullDisplayName}",
                body: "Build failed. Check logs: ${BUILD_URL}",
                recipientProviders: [[$class: 'RequesterRecipientProvider']]
            )
        }
        unstable {
            archiveArtifacts artifacts: '**/target/*.jar', allowEmptyArchive: true
        }
        always {
            cleanWs()
        }
    }
}
```

### Shared Library for Deployments

```groovy
// vars/deployToKubernetes.groovy
def call(Map config) {
    def namespace = config.namespace ?: 'default'
    def manifests = config.manifests ?: 'k8s/*.yaml'
    def timeout = config.timeout ?: 300
    
    timeout(time: timeout, unit: 'SECONDS') {
        stage("Deploy to ${namespace}") {
            withKubeConfig([credentialsId: config.kubeconfigId]) {
                sh """
                    kubectl apply -f ${manifests} -n ${namespace}
                    kubectl rollout status deployment/${config.app} -n ${namespace} --timeout=${timeout}s
                """
            }
        }
    }
}

// vars/sonarqubeAnalysis.groovy
def call(Map config = [:]) {
    def qualityGate = config.qualityGate ?: true
    
    stage('SonarQube Analysis') {
        withSonarQubeEnv(config.sonarName ?: 'SonarQube') {
            sh "mvn sonar:sonar \
                -Dsonar.projectKey=${env.APP_NAME} \
                -Dsonar.projectVersion=${env.APP_VERSION} \
                -Dsonar.java.source=17 \
                -Dsonar.java.binaries=target/classes"
        }
    }
    
    if (qualityGate) {
        stage('Quality Gate') {
            timeout(time: 15, unit: 'MINUTES') {
                def qg = waitForQualityGate()
                if (qg.status != 'OK') {
                    unstable("Quality Gate failed: ${qg.status}")
                }
            }
        }
    }
}

// vars/notifyTeams.groovy
def call(Map config) {
    def webhookUrl = config.webhookUrl ?: ''
    def status = currentBuild.currentResult
    def color = status == 'SUCCESS' ? '2DC76D' : 'D93F3F'
    
    if (webhookUrl) {
        httpRequest(
            url: webhookUrl,
            httpMode: 'POST',
            contentType: 'APPLICATION_JSON',
            requestBody: """
                {
                    "@type": "MessageCard",
                    "@context": "http://schema.org/extensions",
                    "themeColor": "${color}",
                    "summary": "${config.title ?: env.JOB_NAME} - ${status}",
                    "sections": [{
                        "activityTitle": "${config.title ?: env.JOB_NAME}",
                        "activitySubtitle": "${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        "activityImage": "https://jenkins.example.com/logo.png",
                        "facts": [
                            {"name": "Status", "value": "${status}"},
                            {"name": "Duration", "value": "${currentBuild.durationString}"}
                        ],
                        "markdown": true,
                        "text": "${config.message ?: "Build ${status}"}"
                    }],
                    "potentialAction": [{
                        "@type": "OpenUri",
                        "name": "View Build",
                        "targets": [{"os": "default", "uri": "${env.BUILD_URL}"}]
                    }]
                }
            """
        )
    }
}
```

### Scripted Pipeline with Complex Logic

```groovy
node('master') {
    stage('Prepare') {
        checkout scm
        def props = readProperties file: 'version.properties'
        env.APP_VERSION = props.version
        env.RELEASE_BRANCH = "release/v${env.APP_VERSION}"
    }
    
    if (env.CHANGE_ID) {
        stage('Pull Request Build') {
            withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                sh """
                    gh pr status --json state,number
                    if [[ \$(gh pr status --json state --jq '.[] | select(.state == "MERGED")') ]]; then
                        echo "PR already merged, skipping"
                    fi
                """
            }
        }
    }
    
    def shouldDeploy = false
    
    stage('Test') {
        parallel (
            'Unit Tests': {
                sh 'mvn test -Dtest=*Test'
            },
            'Integration Tests': {
                sh 'mvn verify -Pintegration -DskipUnitTests'
            }
        )
        shouldDeploy = currentBuild.result == 'SUCCESS'
    }
    
    if (shouldDeploy && env.BRANCH_NAME == 'main') {
        stage('Create Release Branch') {
            withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                sh """
                    git checkout -b ${RELEASE_BRANCH}
                    sed -i "s/version=.*/version=${APP_VERSION}/" version.properties
                    git add .
                    git commit -m "Bump version to ${APP_VERSION}"
                    git push origin ${RELEASE_BRANCH}
                    gh pr create --title "Release ${APP_VERSION}" --body "Release branch for v${APP_VERSION}"
                """
            }
        }
    }
    
    stage('Cleanup') {
        cleanWs()
    }
}
```

### Jenkins Configuration as Code

```yaml
# jenkins.yaml
jenkins:
  systemMessage: "Welcome to Jenkins - CI/CD Platform"
  numExecutors: 5
  primaryView:
    all:
      name: "all"
  views:
    - all
  mode: NORMAL
  
  securityRealm:
    ldap:
      configurations:
        - server: "ldap.example.com"
          rootDN: "dc=example,dc=com"
          userSearchBase: "ou=users"
          userSearchFilter: "uid={0}"
          groupSearchBase: "ou=groups"
          groupSearchFilter: ""
          disableMailAddressResolver: false
          displayNameAttributeName: "displayName"
          mailAddressAttributeName: "mail"
      cache:
        size: 100
        ttl: 10
      userIdStrategy: CaseInsensitive
      groupIdStrategy: CaseInsensitive
  
  authorizationStrategy:
    globalMatrix:
      permissions:
        - "Overall/Administer:admin-group"
        - "Overall/Read:authenticated"
        - "Job/Read:authenticated"
        - "Job/Build:authenticated"
        - "Job/Discover:authenticated"
        - "Run/Update:authenticated"
  
  crumbIssuer:
    standard:
      enableSecurity: true
  
  remotingSecurity:
    enabled: true
  
  nodes:
    - permanent:
        name: "build-agent-1"
        numExecutors: 4
        remoteFS: "/var/jenkins/agent"
        launcher:
          jnlp:
            workDirSettings:
              disabled: false
              failIfWorkDirMissing: false
              workDirPath: "/var/jenkins/agent/workdir"
        mode: EXCLUSIVE
        nodeProperties:
          - envVars:
              env:
                - key: "JAVA_HOME"
                  value: "/usr/lib/jvm/java-17"
        retentionStrategy:
          always:
            inDemandDelay: 0
            idleDelay: 60

unclassified:
  location:
    url: "https://jenkins.example.com"
    adminAddress: "jenkins-admin@example.com"
  
  artifactManager:
    artifactManagerStorage:
      filePath:
        rootDirectory: "/var/jenkins/artifacts"
  
  buildDiscarders:
    configuredBuildDiscarders:
      - logRotator:
          numToKeepStr: "10"
          artifactNumToKeepStr: "5"
  
  timestamper:
    allPipelines: true
    elapsedTimeFormat: "'<elapsed in <HH:mm:ss>'"
  
  buildTriggerReadsConfiguration: true
```

## Best Practices

- Store pipeline definitions as code (Jenkinsfile) in version control alongside application code
- Use declarative pipelines for most workflows, falling back to scripted for complex logic
- Implement proper error handling with try-catch blocks and post conditions
- Use parallel stages to speed up build and test execution
- Leverage shared libraries to DRY pipeline code across projects
- Use agent directives to optimize resource allocation for different stages
- Implement proper credential management, never hardcode secrets
- Configure build retention policies to manage disk space efficiently
- Use Kubernetes plugin for dynamic agent provisioning
- Integrate automated security scanning in CI pipelines
- Implement proper checkout and cleanup steps
- Use input parameters for manual approval gates in deployment stages
- Monitor pipeline performance and optimize slow stages
- Use Blue Ocean UI for better pipeline visualization
- Implement proper notification strategies for build results
- Use configuration as code for Jenkins management
- Regular plugin updates and security patching

## Common Patterns

- **Pipeline Library Pattern**: Extract reusable logic into shared libraries
- **Matrix Build Pattern**: Test against multiple configurations simultaneously
- **Parallel Stage Pattern**: Execute independent stages concurrently
- **Input Gate Pattern**: Manual approval before critical deployment stages
- **Fingerprint Pattern**: Track artifact lineage across builds
- **Checkpoint Pattern**: Save and restore build state for long-running pipelines
- **Build-on-Change Pattern**: Trigger builds on file changes or schedule
- **Merge Request Pipeline**: Run validation on pull requests before merging
- **Multi-Branch Pipeline**: Automatically create pipelines for each branch
- **Organization Folder Pattern**: Automatically discover and create pipelines
