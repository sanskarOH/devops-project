pipeline {
  agent any

  environment {
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
          sh 'npm test'
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        sh 'docker build -t $BACKEND_IMAGE -t $LATEST_BACKEND ./backend'
        sh 'docker build -t $FRONTEND_IMAGE -t $LATEST_FRONTEND ./frontend'
      }
    }

    stage('Push Docker Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh 'docker push $BACKEND_IMAGE'
          sh 'docker push $FRONTEND_IMAGE'
          sh 'docker push $LATEST_BACKEND'
          sh 'docker push $LATEST_FRONTEND'
        }
      }
    }

    stage('Deploy To EC2') {
      steps {
        sshagent(credentials: ['ec2-ssh-key']) {
          sh '''
            ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} \
            "export DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME} && export BUILD_NUMBER=${BUILD_NUMBER} && bash -s" < infra/scripts/deploy-ec2.sh
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
            --data '{"text":"SUCCESS: URL Shortener pipeline #${BUILD_NUMBER} completed."}' \
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
            --data '{"text":"FAILED: URL Shortener pipeline #${BUILD_NUMBER} failed."}' \
            $SLACK_WEBHOOK_URL
          '''
        }
      }
    }
  }
}
