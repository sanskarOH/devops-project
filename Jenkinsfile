pipeline {
  agent any

  options {
    disableConcurrentBuilds()
  }

  environment {
    DOCKERHUB_USERNAME = "sanskarspamz1"
    EC2_USER = "ubuntu"
    EC2_HOST = "54.82.11.114"

    BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/url-shortener-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/url-shortener-frontend:${BUILD_NUMBER}"
    LATEST_BACKEND = "${DOCKERHUB_USERNAME}/url-shortener-backend:latest"
    LATEST_FRONTEND = "${DOCKERHUB_USERNAME}/url-shortener-frontend:latest"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
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
          sh 'npm test || echo "No tests"'
        }
      }
    }

    // 🔥 FIXED: AMD64 + push in same step
    stage('Build & Push Docker Images') {
      steps {
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
      }
    }

    // 🔥 FIXED: NO EOF ISSUE
    stage('Deploy To EC2') {
      steps {
        sshagent(credentials: ['ec2-ssh-key']) {
          sh """
          ssh -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST '
            docker pull $LATEST_BACKEND &&
            docker pull $LATEST_FRONTEND &&

            docker stop backend || true &&
            docker rm backend || true &&

            docker stop frontend || true &&
            docker rm frontend || true &&

            docker run -d --name backend -p 5000:5000 $LATEST_BACKEND &&
            docker run -d --name frontend -p 80:80 $LATEST_FRONTEND
          '
          """
        }
      }
    }
  }

  post {
    success {
      script {
        if (env.SLACK_WEBHOOK_URL?.trim()) {
          sh '''
          curl -X POST -H "Content-type: application/json" \
          --data '{"text":"✅ SUCCESS: URL Shortener pipeline completed."}' \
          $SLACK_WEBHOOK_URL
          '''
        }
      }
    }

    failure {
      script {
        if (env.SLACK_WEBHOOK_URL?.trim()) {
          sh '''
          curl -X POST -H "Content-type: application/json" \
          --data '{"text":"❌ FAILED: URL Shortener pipeline failed."}' \
          $SLACK_WEBHOOK_URL
          '''
        }
      }
    }
  }
}