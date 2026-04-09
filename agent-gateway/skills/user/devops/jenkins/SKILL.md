---
name: jenkins
description: Open-source automation server for building, testing, and deploying code with extensive plugin ecosystem
category: devops
---

# Jenkins

## What I Do

I am an open-source automation server that orchestrates the entire CI/CD pipeline. I build, test, and deploy your code through configurable pipelines, enabling automated delivery from commit to production.

## When to Use Me

- Building complex CI/CD workflows
- Integrating with extensive plugin ecosystem
- On-premise or self-hosted automation
- Custom pipeline as code requirements
- Enterprise deployments with existing Jenkins infrastructure
- Migrating from legacy CI systems
- Orchestrating multi-stage deployments

## Core Concepts

- **Pipeline**: Automated process for building, testing, deploying
- **Declarative vs Scripted Pipeline**: Two DSL approaches
- **Stages**: Major phases in the pipeline
- **Steps**: Individual actions within stages
- **Agents**: Executors that run pipeline steps
- **Shared Libraries**: Reusable pipeline code
- **Build Triggers**: Events that start pipelines
- **Parameters**: Runtime inputs to pipelines
- **Credentials**: Secure storage for secrets
- **Plugins**: Extensions for additional functionality

## Code Examples

**Declarative Pipeline (Jenkinsfile):**
```groovy
pipeline {
    agent {
        docker {
            image 'maven:3.8.6-openjdk-11'
            args '-v /root/.m2:/root/.m2'
        }
    }
    
    environment {
        APP_NAME = 'my-service'
        DOCKER_REGISTRY = 'registry.example.com'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'mvn clean compile -DskipTests'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'trivy fs --exit-code 1 .'
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    dockerImage = docker.build("${DOCKER_REGISTRY}/${APP_NAME}:${BUILD_NUMBER}")
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh "helm upgrade --install ${APP_NAME} ./helm/chart --set image.tag=${BUILD_NUMBER}"
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input message: 'Deploy to production?'
            steps {
                sh "helm upgrade --install ${APP_NAME} ./helm/chart --set image.tag=${BUILD_NUMBER}"
                sh "curl -X POST https://hooks.example.com/deploy"
            }
        }
    }
    
    post {
        success {
            archiveArtifacts artifacts: '**/target/*.jar', fingerprint: true
        }
        failure {
            slackSend channel: '#devops-alerts',
                      color: 'danger',
                      message: "Pipeline failed: ${env.BUILD_URL}"
        }
    }
}
```

**Scripted Pipeline:**
```groovy
node {
    stage('Setup') {
        checkout scm
        sh 'npm ci'
    }
    
    stage('Test') {
        try {
            sh 'npm test'
        } catch (err) {
            currentBuild.result = 'FAILURE'
            throw err
        } finally {
            junit '**/junit.xml'
        }
    }
    
    stage('Build Docker') {
        def image = docker.build("myapp:${env.BUILD_ID}")
        
        stage('Push') {
            docker.withRegistry('https://registry.example.com', 'docker-credentials') {
                image.push('latest')
                image.push(env.BUILD_ID)
            }
        }
    }
}
```

**Shared Library (vars/buildPipeline.groovy):**
```groovy
def call(Map config) {
    pipeline {
        agent config.agent ?: 'any'
        
        stages {
            stage('Build') {
                steps {
                    sh config.buildCommand ?: 'make build'
                }
            }
            
            stage('Test') {
                steps {
                    sh config.testCommand ?: 'make test'
                }
                post {
                    always {
                        junit config.testReports ?: '**/test-results/*.xml'
                    }
                }
            }
            
            stage('Deploy') {
                when {
                    branch 'main'
                }
                steps {
                    sh config.deployCommand ?: 'make deploy'
                }
            }
        }
    }
}
```

**Multi-branch Pipeline (Jenkinsfile):**
```groovy
pipeline {
    agent any
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
    }
    
    triggers {
        pollSCM('H/5 * * * *')
        githubPush()
    }
    
    stages {
        stage('CI') {
            matrix {
                axes {
                    axis {
                        name 'PLATFORM'
                        values 'linux', 'macos', 'windows'
                    }
                }
                agent { label PLATFORM }
                stages {
                    stage('Build') {
                        steps {
                            sh "make build-${PLATFORM}"
                        }
                    }
                    stage('Test') {
                        steps {
                            sh "make test-${PLATFORM}"
                        }
                    }
                }
            }
        }
    }
}
```

## Best Practices

1. **Store Jenkinsfile in repo** - Version control your pipeline
2. **Use shared libraries** - DRY principle for pipeline code
3. **Implement quality gates** - Blocking stages for security/scans
4. **Use containers for builds** - Reproducible, isolated builds
5. **Parallelize where possible** - Faster feedback loops
6. **Set reasonable timeouts** - Fail fast on hung builds
7. **Archive artifacts properly** - Easy retrieval of build outputs
8. **Implement notification hooks** - Slack, email, Teams
9. **Use credentials properly** - Never hardcode secrets
10. **Monitor pipeline health** - Track success rates and durations
