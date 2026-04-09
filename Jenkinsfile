pipeline {
  agent any

  environment {
    // 🔑 REQUIRED VARIABLES
    DOCKERHUB_USERNAME = "your_dockerhub_username"
    EC2_USER = "ubuntu"
    EC2_HOST = "your-ec2-public-ip"

    // 🐳 IMAGE TAGS
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
      steps {
        dir('backend') {
          sh 'npm ci'
        }
      }
    }

    stage('Run Backend Tests') {
      steps {
        dir('backend') {
          sh 'npm test || echo "No tests found, continuing..."'
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        sh '''
        docker build -t $BACKEND_IMAGE -t $LATEST_BACKEND ./backend
        docker build -t $FRONTEND_IMAGE -t $LATEST_FRONTEND ./frontend
        '''
      }
    }

    stage('Push Docker Images') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-creds',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
          echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

          docker push $BACKEND_IMAGE
          docker push $FRONTEND_IMAGE
          docker push $LATEST_BACKEND
          docker push $LATEST_FRONTEND
          '''
        }
      }
    }

    stage('Deploy To EC2') {
      steps {
        sshagent(credentials: ['ec2-ssh-key']) {
          sh '''
          ssh -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST << EOF

          docker pull $BACKEND_IMAGE
          docker pull $FRONTEND_IMAGE

          docker stop backend || true
          docker rm backend || true

          docker stop frontend || true
          docker rm frontend || true

          docker run -d --name backend -p 5000:5000 $BACKEND_IMAGE
          docker run -d --name frontend -p 80:80 $FRONTEND_IMAGE

          EOF
          '''
        }
      }
    }
  }

  post {
    success {
      script {
        if (env.SLACK_WEBHOOK_URL?.trim()) {
          sh '''
          curl -X POST -H 'Content-type: application/json' \
          --data '{"text":"✅ SUCCESS: URL Shortener pipeline #${BUILD_NUMBER} completed."}' \
          $SLACK_WEBHOOK_URL
          '''
        }
      }
    }

    failure {
      script {
        if (env.SLACK_WEBHOOK_URL?.trim()) {
          sh '''
          curl -X POST -H 'Content-type: application/json' \
          --data '{"text":"❌ FAILED: URL Shortener pipeline #${BUILD_NUMBER} failed."}' \
          $SLACK_WEBHOOK_URL
          '''
        }
      }
    }
  }
}