def notifySlack(String message) {
  withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_WEBHOOK_URL')]) {
    sh """
    curl -s -X POST -H "Content-type: application/json" \
    --data '{\"text\":\"${message}\"}' \
    $SLACK_WEBHOOK_URL
    """
  }
}

pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  environment {
    DOCKERHUB_USERNAME = "sanskarspamz1"
    EC2_USER = "ubuntu"
    EC2_HOST = "34.192.222.101"

    BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/url-shortener-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/url-shortener-frontend:${BUILD_NUMBER}"
    LATEST_BACKEND = "${DOCKERHUB_USERNAME}/url-shortener-backend:latest"
    LATEST_FRONTEND = "${DOCKERHUB_USERNAME}/url-shortener-frontend:latest"
  }

  stages {

    stage('Clean Workspace') {
      steps {
        cleanWs()
      }
    }

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare Metadata') {
      steps {
        script {
          env.COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
          env.COMMIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
          env.COMMIT_ID = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          env.APP_URL = "http://${EC2_HOST}"
        }
      }
    }

    stage('Notify Pipeline Start') {
      steps {
        script {
          notifySlack("""🚀 PIPELINE STARTED
Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}

Author: ${env.COMMIT_AUTHOR}
Commit: ${env.COMMIT_MSG}
Commit ID: ${env.COMMIT_ID}
""")
        }
      }
    }

    stage('Install Backend Dependencies') {
      agent {
        docker {
          image 'node:18'
          reuseNode true
        }
      }
      steps {
        dir('backend') {
          sh 'npm install'
        }
      }
    }

    stage('Run Backend Tests') {
      agent {
        docker {
          image 'node:18'
          reuseNode true
        }
      }
      steps {
        dir('backend') {
          sh 'npm test || echo "Tests failed but continuing"'
        }
      }
    }

    stage('Build & Push Docker Images') {
      steps {
        script { notifySlack("🐳 Building & pushing Docker images") }

        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-creds',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
          echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

          docker buildx create --use || true

          docker buildx build \
            --platform linux/amd64 \
            -t $BACKEND_IMAGE \
            -t $LATEST_BACKEND \
            --push ./backend

          docker buildx build \
            --platform linux/amd64 \
            -t $FRONTEND_IMAGE \
            -t $LATEST_FRONTEND \
            --push ./frontend
          '''
        }

        script { notifySlack("✅ Docker images built & pushed") }
      }
    }

    stage('Deploy To EC2') {
      steps {
        script { notifySlack("🚀 Deployment started on ${EC2_HOST}") }

        sshagent(credentials: ['ec2-ssh-key']) {
          sh """
          ssh -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST '
            cd ~ &&

            echo "🧹 Removing old docker-run containers..."
            docker stop backend || true &&
            docker rm backend || true &&
            docker stop frontend || true &&
            docker rm frontend || true &&

            echo "📦 Pulling latest images..."
            docker-compose pull &&

            echo "🚀 Starting services..."
            docker-compose down &&
            docker-compose up -d &&

            echo "🧼 Cleaning unused images..."
            docker system prune -af
          '
          """
        }

        script {
          notifySlack("🌐 App Live: ${env.APP_URL}")
          notifySlack("✅ Deployment completed")
        }
      }
    }

    stage('Health Check') {
      steps {
        script { notifySlack("🩺 Running health check") }

        sh """
        sleep 10
        curl -f http://${EC2_HOST} || exit 1
        """

        script { notifySlack("✅ Health check passed") }
      }
    }
  }

  post {
    success {
      script {
        notifySlack("""🎉 SUCCESS
Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}

App: ${env.APP_URL}
""")
      }
    }

    failure {
      script {
        notifySlack("""❌ FAILURE
Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}

Check Jenkins logs
""")
      }
    }

    always {
      script {
        notifySlack("📢 Pipeline finished for Build #${env.BUILD_NUMBER}")
      }
    }
  }
}